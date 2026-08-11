generate:
	@helm lint helm/unleash
	@helm template helm/unleash -n unleash -f helm/unleash/values-commercial.yaml > openshift/unleash.yaml
	@helm template helm/unleash -n unleash -f helm/unleash/values-fedramp.yaml > openshift/unleash-fedramp.yaml

migrate-sync:
	podman run --rm \
		-v $(PWD):/mnt:Z -w /mnt \
		-e V4_UNLEASH_URL -e V4_UNLEASH_TOKEN -e V5_UNLEASH_URL -e V5_UNLEASH_TOKEN \
		quay.io/redhat-services-prod/app-sre-tenant/container-images-master/debug-container-master \
		sh -c "pip install requests && python3 scripts/unleash-migrate.py --yes"
