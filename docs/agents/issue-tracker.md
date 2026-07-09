# Issue tracker de este repo

DataVision no tiene remoto de GitHub ni ningún otro tracker externo configurado. Para efectos como `/wayfinder` (mapas de decisiones a resolver a lo largo de varias sesiones), este repo usa un **tracker local en markdown** bajo `docs/wayfinder/`.

## Estructura

```
docs/wayfinder/
  map.md                 # el mapa (issue raíz)
  tickets/
    001-slug.md           # cada child issue del mapa
    002-otro-slug.md
```

Puede haber más de un mapa a la vez (para distintos efectos); en ese caso cada uno vive en su propio fichero `docs/wayfinder/<nombre>-map.md` con su propia carpeta de tickets `docs/wayfinder/tickets/<nombre>/`, aunque mientras solo haya un efecto activo, `map.md` y `tickets/` a secas son suficientes.

## El mapa

Frontmatter:
```yaml
---
label: wayfinder:map
---
```

Cuerpo: las secciones estándar de wayfinder (Destination, Notes, Decisions so far, Not yet specified, Out of scope). Los tickets abiertos **no** se listan en el mapa — se encuentran consultando los ficheros en `tickets/`.

## Los tickets

Cada ticket es un fichero en `docs/wayfinder/tickets/NNN-slug.md`, con frontmatter:

```yaml
---
id: 1
title: <título del ticket>
type: research | prototype | grilling | task
status: open | closed
assignee: null            # o el nombre de quien lo reclamó
blocked_by: [ ]           # ids de otros tickets (enteros), vacío si no bloqueado
---

## Question

<la pregunta que este ticket resuelve>

## Resolution

<se rellena al cerrar: la respuesta y, si aplica, enlaces a los assets creados>
```

## Bloqueo y frontera

Este tracker no tiene relación de bloqueo nativa (es markdown plano), así que se usa la convención `blocked_by` en el frontmatter, como arriba.

Un ticket está **bloqueado** si `blocked_by` contiene al menos un id cuyo fichero correspondiente tiene `status: open`.

La **frontera** (tickets tomables ahora) son los tickets con:
- `status: open`
- `assignee: null`
- todos los ids en `blocked_by` correspondientes a tickets con `status: closed` (o `blocked_by` vacío)

Para calcular la frontera a mano: listar `docs/wayfinder/tickets/*.md`, leer el frontmatter de cada uno, y aplicar el filtro de arriba.

## Reclamar un ticket

Antes de trabajar un ticket, editar su frontmatter y poner `assignee` al nombre de quien lo reclama (p. ej. `assignee: claude`), **antes** de empezar el trabajo — así sesiones concurrentes no lo retoman a la vez.

## Cerrar un ticket

Al resolver un ticket: rellenar `## Resolution` en el propio fichero, cambiar `status: closed` en el frontmatter, y añadir una línea en `## Decisions so far` del mapa enlazando al ticket.
