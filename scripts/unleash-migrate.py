#!/usr/bin/env python3
import argparse
import glob
import json
import os
import sys
import time
from urllib.parse import urlparse

import requests


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

def download(url: str, token: str, output_file: str, timeout: int = 30) -> dict:
    """Export state from an Unleash instance and save to a file.

    Returns the exported data dict. Raises RuntimeError on failure.
    """
    endpoint = f"{url}/api/admin/state/export"
    headers = {"Authorization": token, "Accept": "application/json"}

    print(f"Exporting from {url}...")

    try:
        response = requests.get(endpoint, headers=headers, timeout=timeout)
    except requests.exceptions.ConnectionError:
        raise RuntimeError(f"Could not connect to {url}. Check the URL and network.")
    except requests.exceptions.Timeout:
        raise RuntimeError(f"Request to {url} timed out.")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Request failed: {e}")

    if response.status_code != 200:
        raise RuntimeError(f"Export failed (HTTP {response.status_code}): {response.text}")

    try:
        data = response.json()
    except json.JSONDecodeError:
        raise RuntimeError(f"Invalid JSON in response: {response.text[:200]}")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

    print(f"  Exported {len(data.get('features', []))} features → {output_file}")
    return data


# ---------------------------------------------------------------------------
# Split
# ---------------------------------------------------------------------------

def split(input_file: str, output_dir: str, batch_size: int = 100) -> bool:
    """Split an Unleash export into a strategies file and feature batch files.

    Returns True if split and validation succeeded. Raises RuntimeError on failure.
    """
    data = _split_load(input_file)

    os.makedirs(output_dir, exist_ok=True)

    print(f"Splitting {len(data['features'])} features into batches of {batch_size}...")

    _write_strategies_file(data, output_dir)

    features = data.get("features", [])
    strategies = data.get("featureStrategies", [])
    environments = data.get("featureEnvironments", [])
    version = data.get("version", 4)

    batches = [features[i:i + batch_size] for i in range(0, len(features), batch_size)]
    for i, batch in enumerate(batches, 1):
        _write_feature_batch(batch, i, strategies, environments, version, output_dir)

    return _validate_split(data, output_dir)


def _split_load(file_path: str) -> dict:
    print(f"Loading {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  Features: {len(data.get('features', []))}")
    print(f"  Feature strategies: {len(data.get('featureStrategies', []))}")
    print(f"  Feature environments: {len(data.get('featureEnvironments', []))}")
    print(f"  Custom strategies: {len(data.get('strategies', []))}")
    return data


def _write_strategies_file(data: dict, output_dir: str) -> None:
    strategies_file = {
        "version": data.get("version", 4),
        "features": [],
        "strategies": data.get("strategies", []),
        "projects": [],
        "tagTypes": [],
        "tags": [],
        "featureTags": [],
        "featureStrategies": [],
        "environments": [],
        "featureEnvironments": [],
        "segments": [],
        "featureStrategySegments": [],
    }
    path = os.path.join(output_dir, "unleash-strategies.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(strategies_file, f, indent=4, ensure_ascii=False)
    print(f"  Created {path} ({len(strategies_file['strategies'])} strategies)")


def _write_feature_batch(
    batch: list,
    batch_num: int,
    all_strategies: list,
    all_environments: list,
    version: int,
    output_dir: str,
) -> None:
    feature_names = {f["name"] for f in batch}
    batch_strategies = [s for s in all_strategies if s.get("featureName") in feature_names]
    batch_environments = [e for e in all_environments if e.get("featureName") in feature_names]

    batch_file = {
        "version": version,
        "features": batch,
        "strategies": [],
        "projects": [],
        "tagTypes": [],
        "tags": [],
        "featureTags": [],
        "featureStrategies": batch_strategies,
        "environments": [],
        "featureEnvironments": batch_environments,
        "segments": [],
        "featureStrategySegments": [],
    }

    path = os.path.join(output_dir, f"unleash-features-{batch_num:03d}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(batch_file, f, indent=4, ensure_ascii=False)
    print(f"  Created {path} ({len(batch)} features, {len(batch_strategies)} strategies)")


def _validate_split(original: dict, output_dir: str) -> bool:
    print("Validating split files...")

    original_features = {f["name"] for f in original.get("features", [])}
    original_strategies = len(original.get("featureStrategies", []))
    original_environments = len(original.get("featureEnvironments", []))

    feature_files = sorted(
        f for f in os.listdir(output_dir)
        if f.startswith("unleash-features-") and f.endswith(".json")
    )

    split_features = set()
    total_strategies = 0
    total_environments = 0

    for filename in feature_files:
        with open(os.path.join(output_dir, filename), "r", encoding="utf-8") as f:
            data = json.load(f)
        split_features.update(f["name"] for f in data.get("features", []))
        total_strategies += len(data.get("featureStrategies", []))
        total_environments += len(data.get("featureEnvironments", []))

    missing = original_features - split_features
    extra = split_features - original_features

    if missing:
        raise RuntimeError(f"Validation failed — missing features: {missing}")
    if extra:
        raise RuntimeError(f"Validation failed — extra features: {extra}")
    if total_strategies != original_strategies:
        raise RuntimeError(
            f"Validation failed — strategy count mismatch: {total_strategies} vs {original_strategies}"
        )
    if total_environments != original_environments:
        raise RuntimeError(
            f"Validation failed — environment count mismatch: {total_environments} vs {original_environments}"
        )

    print(f"  Validation passed: {len(split_features)} features, {total_strategies} strategies")
    return True


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------

def import_to_v5(
    url: str,
    token: str,
    split_dir: str,
    source_env: str = "default",
    target_env: str = "production",
    delay_seconds: int = 2,
    import_timeout: int = 120,
) -> tuple:
    """Import split files into a v5 Unleash instance.

    Returns (successful_count, failed_count). Raises RuntimeError if no files found.
    """
    print(f"Importing to {url}")
    print(f"  Environment: '{source_env}' → '{target_env}'")

    import_files = _get_import_files(split_dir)
    if not import_files:
        raise RuntimeError(f"No import files found in '{split_dir}'")

    print(f"  Files: {[os.path.basename(f) for f in import_files]}")

    headers = {"Authorization": token, "Content-Type": "application/json"}
    endpoint = f"{url}/api/admin/state/import"
    params = {"drop": "false", "keep": "true"}

    successful = 0
    failed = 0

    for i, file_path in enumerate(import_files, 1):
        filename = os.path.basename(file_path)
        print(f"\n[{i}/{len(import_files)}] Importing {filename}...")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            data = _transform_environment(data, source_env, target_env)

            response = requests.post(
                endpoint,
                headers=headers,
                data=json.dumps(data, ensure_ascii=False),
                params=params,
                timeout=import_timeout,
            )

            if response.status_code in [200, 202]:
                print(f"  ✅ {filename} imported.")
                successful += 1
            else:
                print(f"  ❌ Failed (HTTP {response.status_code}): {response.text}")
                failed += 1

        except requests.exceptions.RequestException as e:
            print(f"  ❌ Request error: {e}")
            failed += 1
        except Exception as e:
            print(f"  ❌ Unexpected error: {e}")
            failed += 1

        if i < len(import_files):
            time.sleep(delay_seconds)

    return successful, failed


def _get_import_files(split_dir: str) -> list:
    if not os.path.exists(split_dir):
        return []

    all_files = glob.glob(os.path.join(split_dir, "*.json"))
    result = []

    strategies_file = os.path.join(split_dir, "unleash-strategies.json")
    if os.path.exists(strategies_file):
        result.append(strategies_file)

    feature_files = sorted(f for f in all_files if "unleash-features-" in f)
    result.extend(feature_files)

    return result


def _transform_environment(data: dict, source_env: str, target_env: str) -> dict:
    for strategy in data.get("featureStrategies", []):
        if strategy.get("environment") == source_env:
            strategy["environment"] = target_env
    for env in data.get("featureEnvironments", []):
        if env.get("environment") == source_env:
            env["environment"] = target_env
    return data


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

def delete_all_flags(
    url: str,
    token: str,
    timeout: int = 30,
    confirm_callback=None,
) -> tuple:
    """Two-stage delete of all flags from an Unleash instance.

    confirm_callback(stage, count) -> bool: called before each destructive stage.
        stage is "archive" or "delete". If None, proceeds without confirmation.

    Returns (archived_count, deleted_project_count).
    """
    print(f"Target: {url}")

    headers = {
        "Authorization": token,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    projects_api = f"{url}/api/admin/projects"

    project_flags_map = _collect_flags(projects_api, headers, timeout)
    total_flags = sum(len(v) for v in project_flags_map.values())

    if total_flags == 0:
        print("No feature flags found.")
        return 0, 0

    print(f"Found {total_flags} flags across {len(project_flags_map)} project(s).")

    if confirm_callback and not confirm_callback("archive", total_flags):
        print("Archive cancelled.")
        return 0, 0

    archived_flags_map = _archive_flags(project_flags_map, projects_api, headers)
    archived_count = sum(len(v) for v in archived_flags_map.values())
    print(f"\nStage 1 complete: {archived_count}/{total_flags} flags archived.")

    if archived_count == 0:
        raise RuntimeError("No flags were archived. Aborting permanent deletion.")

    if confirm_callback and not confirm_callback("delete", archived_count):
        print("Permanent deletion cancelled. Flags remain archived.")
        return archived_count, 0

    deleted_count = _permanently_delete(archived_flags_map, projects_api, headers, timeout)
    print(f"\nStage 2 complete: permanent delete sent for {deleted_count} project(s).")

    return archived_count, deleted_count


def _collect_flags(projects_api: str, headers: dict, timeout: int) -> dict:
    print("Fetching projects...")
    response = requests.get(projects_api, headers=headers, timeout=timeout)
    if response.status_code != 200:
        raise RuntimeError(
            f"Failed to fetch projects (HTTP {response.status_code}): {response.text}"
        )

    projects = response.json().get("projects", [])
    project_flags_map = {}

    for project in projects:
        project_id = project["id"]
        flags_response = requests.get(
            f"{projects_api}/{project_id}/features", headers=headers, timeout=timeout
        )
        if flags_response.status_code == 200:
            features = flags_response.json().get("features", [])
            if features:
                project_flags_map[project_id] = [f["name"] for f in features]
                print(f"  Project '{project_id}': {len(features)} flags")
        else:
            print(f"  WARNING: Could not fetch flags for project '{project_id}' (HTTP {flags_response.status_code})")

    return project_flags_map


def _archive_flags(project_flags_map: dict, projects_api: str, headers: dict) -> dict:
    print("\nStage 1: Archiving flags...")
    archived_flags_map = {}

    for project_id, flag_names in project_flags_map.items():
        archived = []
        for flag_name in flag_names:
            try:
                response = requests.delete(
                    f"{projects_api}/{project_id}/features/{flag_name}",
                    headers=headers,
                    timeout=10,
                )
                if response.status_code == 202:
                    archived.append(flag_name)
                else:
                    print(f"  [FAILED] {flag_name} (HTTP {response.status_code})")
                time.sleep(0.05)
            except requests.exceptions.RequestException as e:
                print(f"  [ERROR] {flag_name}: {e}")

        if archived:
            archived_flags_map[project_id] = archived

    return archived_flags_map


def _permanently_delete(archived_flags_map: dict, projects_api: str, headers: dict, timeout: int) -> int:
    print("\nStage 2: Permanently deleting archived flags...")
    deleted_count = 0

    for project_id, flag_names in archived_flags_map.items():
        try:
            response = requests.post(
                f"{projects_api}/{project_id}/delete",
                headers=headers,
                json={"features": flag_names},
                timeout=timeout,
            )
            if response.status_code == 200:
                print(f"  [DELETED] {len(flag_names)} flags from project '{project_id}'")
                deleted_count += 1
            else:
                print(f"  [FAILED] Project '{project_id}' (HTTP {response.status_code}): {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"  [ERROR] Project '{project_id}': {e}")

    return deleted_count


# ---------------------------------------------------------------------------
# Validate
# ---------------------------------------------------------------------------

def validate(
    v4_url: str,
    v4_token: str,
    v4_name: str,
    v5_url: str,
    v5_token: str,
    v5_name: str,
    output_dir: str = "unleash",
    timeout: int = 30,
) -> bool:
    """Download fresh exports from both instances and compare.

    Returns True if migration is complete (no missing features or strategies).
    """
    os.makedirs(output_dir, exist_ok=True)

    v4_file = os.path.join(output_dir, f"{_slug(v4_name)}.json")
    v5_file = os.path.join(output_dir, f"{_slug(v5_name)}.json")

    v4_data = _download_instance(v4_name, v4_url, v4_token, v4_file, timeout)
    v5_data = _download_instance(v5_name, v5_url, v5_token, v5_file, timeout)

    return _compare(v4_data, v4_name, v5_data, v5_name)


def _slug(name: str) -> str:
    return name.lower().replace(" ", "-")


def _download_instance(name: str, url: str, token: str, output_file: str, timeout: int) -> dict:
    endpoint = f"{url}/api/admin/state/export"
    headers = {"Authorization": token, "Accept": "application/json"}

    print(f"Downloading from {name} ({url})...")
    try:
        response = requests.get(endpoint, headers=headers, timeout=timeout)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to connect to {name}: {e}")

    if response.status_code != 200:
        raise RuntimeError(f"Export from {name} failed (HTTP {response.status_code}): {response.text}")

    data = response.json()
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

    print(f"  Features: {len(data.get('features', []))}, Strategies: {len(data.get('strategies', []))}")
    return data


def _compare(v4: dict, v4_name: str, v5: dict, v5_name: str) -> bool:
    print(f"\nComparing {v4_name} vs {v5_name}...")
    print(f"{'Section':<22} {v4_name:<14} {v5_name:<14} Diff")
    print("-" * 60)

    for section in ["features", "strategies", "projects", "featureStrategies", "featureEnvironments"]:
        v4_count = len(v4.get(section, []))
        v5_count = len(v5.get(section, []))
        diff = v5_count - v4_count
        diff_str = f"{diff:+d}" if diff != 0 else "0"
        print(f"  {section:<20} {v4_count:<14} {v5_count:<14} {diff_str}")

    v4_features = {f["name"] for f in v4.get("features", [])}
    v5_features = {f["name"] for f in v5.get("features", [])}
    missing = v4_features - v5_features
    extra = v5_features - v4_features

    if missing:
        print(f"\n  Features missing in v5 ({len(missing)}):")
        for f in sorted(missing):
            print(f"    - {f}")
    if extra:
        print(f"\n  Extra features in v5 ({len(extra)}):")
        for f in sorted(extra):
            print(f"    + {f}")

    v4_strategies = {s["name"] for s in v4.get("strategies", [])}
    v5_strategies = {s["name"] for s in v5.get("strategies", [])}
    missing_strats = v4_strategies - v5_strategies
    if missing_strats:
        print(f"\n  Strategies missing in v5: {', '.join(sorted(missing_strats))}")

    v4_envs = {e.get("environment") for e in v4.get("featureEnvironments", [])}
    v5_envs = {e.get("environment") for e in v5.get("featureEnvironments", [])}
    print(f"\n  Environments in v4: {sorted(v4_envs)}")
    print(f"  Environments in v5: {sorted(v5_envs)}")

    success = not missing and not missing_strats
    if success:
        print("\n  ✅ Migration complete — all features and strategies present.")
    else:
        print(f"\n  ⚠️  Migration incomplete — {len(missing)} feature(s) and {len(missing_strats)} strategy(ies) missing.")

    return success


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

STEPS = ["delete", "download", "split", "import", "validate"]


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Required environment variable '{name}' is not set.")
    return value


def _instance_name_from_url(url: str) -> str:
    """Derive a display name from a URL's hostname, e.g. https://ocm-stage.unleash.devshift.net -> ocm-stage."""
    return urlparse(url).netloc.split(".")[0]


def load_config(path: str) -> dict:
    """Load non-secret settings from `path` and instance url/token from the environment.

    Tokens are never read from disk — they come from V4_UNLEASH_URL/V4_UNLEASH_TOKEN
    and V5_UNLEASH_URL/V5_UNLEASH_TOKEN so the Jenkins job can inject them from Vault.
    """
    with open(path, "r") as f:
        config = json.load(f)

    config_dir = os.path.dirname(os.path.abspath(path))
    settings = config["settings"]
    settings["export_file"] = os.path.join(config_dir, settings["export_file"])
    settings["split_dir"] = os.path.join(config_dir, settings["split_dir"])

    v4_url = _require_env("V4_UNLEASH_URL")
    v5_url = _require_env("V5_UNLEASH_URL")
    config["v4"] = {
        "name": _instance_name_from_url(v4_url),
        "url": v4_url,
        "token": _require_env("V4_UNLEASH_TOKEN"),
    }
    config["v5"] = {
        "name": _instance_name_from_url(v5_url),
        "url": v5_url,
        "token": _require_env("V5_UNLEASH_TOKEN"),
    }

    return config


def interactive_confirm(stage: str, count: int) -> bool:
    if stage == "archive":
        expected = f"archive {count} flags"
        answer = input(f"\nType '{expected}' to continue: ")
        return answer == expected
    elif stage == "delete":
        answer = input("\nType 'permanently delete' to continue: ")
        return answer == "permanently delete"
    return False


def run_step(step: str, config: dict, auto_confirm: bool) -> bool:
    s = config["settings"]
    v4 = config["v4"]
    v5 = config["v5"]

    try:
        if step == "delete":
            print("\n=== DELETE ===")
            if auto_confirm:
                print("WARNING: --yes flag set. Proceeding without confirmation.")
            archived, deleted = delete_all_flags(
                url=v5["url"],
                token=v5["token"],
                timeout=s["request_timeout_seconds"],
                confirm_callback=None if auto_confirm else interactive_confirm,
            )
            print(f"Result: {archived} archived, {deleted} project(s) permanently deleted.")

        elif step == "download":
            print("\n=== DOWNLOAD ===")
            os.makedirs(os.path.dirname(s["export_file"]), exist_ok=True)
            data = download(
                url=v4["url"],
                token=v4["token"],
                output_file=s["export_file"],
                timeout=s["request_timeout_seconds"],
            )
            print(f"Result: {len(data.get('features', []))} features exported.")

        elif step == "split":
            print("\n=== SPLIT ===")
            split(
                input_file=s["export_file"],
                output_dir=s["split_dir"],
                batch_size=s["batch_size"],
            )

        elif step == "import":
            print("\n=== IMPORT ===")
            ok, fail = import_to_v5(
                url=v5["url"],
                token=v5["token"],
                split_dir=s["split_dir"],
                source_env=s["source_environment"],
                target_env=s["target_environment"],
                delay_seconds=s["import_delay_seconds"],
                import_timeout=s["import_timeout_seconds"],
            )
            print(f"Result: {ok} successful, {fail} failed.")
            if fail > 0:
                raise RuntimeError(f"{fail} file(s) failed to import.")

        elif step == "validate":
            print("\n=== VALIDATE ===")
            passed = validate(
                v4_url=v4["url"],
                v4_token=v4["token"],
                v4_name=v4["name"],
                v5_url=v5["url"],
                v5_token=v5["token"],
                v5_name=v5["name"],
                output_dir=os.path.dirname(s["export_file"]),
                timeout=s["request_timeout_seconds"],
            )
            if not passed:
                raise RuntimeError("Validation failed — migration is incomplete.")

        return True

    except RuntimeError as e:
        print(f"\n❌ Step '{step}' failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Unleash v4 → v5 migration runner.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"Steps: {', '.join(STEPS)}",
    )
    parser.add_argument(
        "--config",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "unleash-migrate-config.json"),
        help="Path to config file (default: unleash-migrate-config.json next to this script)",
    )
    parser.add_argument(
        "--step",
        choices=STEPS + ["all"],
        default="all",
        help="Run a single step or the full pipeline (default: all)",
    )
    parser.add_argument(
        "--yes", "-y",
        action="store_true",
        help="Skip confirmation prompts for destructive operations",
    )
    args = parser.parse_args()

    try:
        config = load_config(args.config)
    except FileNotFoundError:
        print(f"❌ Config file not found: {args.config}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in config file: {e}")
        sys.exit(1)
    except RuntimeError as e:
        print(f"❌ {e}")
        sys.exit(1)

    steps = STEPS if args.step == "all" else [args.step]

    print(f"Unleash Migration — steps: {', '.join(steps)}")
    print(f"  v4: {config['v4']['name']} ({config['v4']['url']})")
    print(f"  v5: {config['v5']['name']} ({config['v5']['url']})")

    for step in steps:
        if not run_step(step, config, args.yes):
            print(f"\nPipeline stopped at step '{step}'.")
            sys.exit(1)

    print("\n✅ Done.")


if __name__ == "__main__":
    main()
