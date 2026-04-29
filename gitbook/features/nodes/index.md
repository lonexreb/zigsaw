# Node Reference

Every node in Zigsaw is documented here. Pages follow a consistent template:
inputs, outputs, configuration, auth, examples, common errors, cost, related.

> Source of truth for node behavior is the implementation under
> `frontend/src/components/nodes/`. If a doc page disagrees with the code,
> the code wins — please open a PR fixing the doc.

## Triggers

| Node                    | Page                                              |
| ----------------------- | ------------------------------------------------- |
| Manual                  | [`trigger`](./trigger.md)                         |
| Webhook                 | [`trigger`](./trigger.md#webhook)                 |
| Schedule (cron)         | [`trigger`](./trigger.md#schedule)                |
| Login (auth gate)       | [`login`](./login.md)                             |

## AI Models

| Node                    | Page                                              |
| ----------------------- | ------------------------------------------------- |
| Universal Agent (Claude)| [`universal-agent`](./universal-agent.md)         |
| Groq Llama              | [`groq-llama`](./groq-llama.md)                   |
| Whisper (STT)           | [`whisper`](./whisper.md)                         |
| BLIP-2 (vision)         | [`blip2`](./blip2.md)                             |
| Imagen (image gen)      | [`imagen`](./imagen.md)                           |
| Veo3 (video gen)        | [`veo3`](./veo3.md)                               |

## Integrations

| Node                    | Page                                              |
| ----------------------- | ------------------------------------------------- |
| GitHub                  | [`github`](./github.md)                           |
| Claude GitHub Pipeline  | [`claude-github-pipeline`](./claude-github-pipeline.md) |
| Gmail                   | [`gmail`](./gmail.md)                             |
| Google Calendar         | [`google-calendar`](./google-calendar.md)         |
| API connector           | [`api-connector`](./api-connector.md)             |
| Firecrawl (web extract) | [`firecrawl`](./firecrawl.md)                     |

## Data

| Node                    | Page                                              |
| ----------------------- | ------------------------------------------------- |
| Document parser         | [`document`](./document.md)                       |
| Database                | [`database`](./database.md)                       |
| Feature                 | [`feature`](./feature.md)                         |

## Logic

| Node                    | Page                                              |
| ----------------------- | ------------------------------------------------- |
| Router                  | [`router`](./router.md)                           |
| Loop                    | [`loop`](./loop.md)                               |
| Human-in-the-Loop       | [`human-in-the-loop`](./human-in-the-loop.md)     |
| Title (annotation)      | [`title`](./title.md)                             |
