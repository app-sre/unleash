generate:
	@helm lint helm/unleash
	@helm template helm/unleash -n unleash -f helm/unleash/values-commercial.yaml > openshift/unleash.yaml
	@helm template helm/unleash -n unleash -f helm/unleash/values-fedramp.yaml > openshift/unleash-fedramp.yaml