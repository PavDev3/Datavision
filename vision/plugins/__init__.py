from plugins.base import DomainPlugin
from plugins.trafico import TraficoPlugin

DOMAIN_REGISTRY: dict[str, DomainPlugin] = {"trafico": TraficoPlugin()}

__all__ = ["DomainPlugin", "DOMAIN_REGISTRY"]
