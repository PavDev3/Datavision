from app.plugins.base import DomainPlugin

DOMAIN_REGISTRY: dict[str, DomainPlugin] = {}

__all__ = ["DomainPlugin", "DOMAIN_REGISTRY"]
