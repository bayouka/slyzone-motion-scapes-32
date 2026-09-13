# 4b4c — Remote Desktop policy

Status: ACTIVE WORKFLOW RULE

Remote Desktop Commander is not a normal development, audit, deployment or project-management path for 4b4c.

Normal authority/order:
1. GitHub canonical repository (`bayouka/slyzone-motion-scapes-32`, `main`).
2. Canonical remote services and connectors, notably Supabase for backend/data operations.
3. Cloudflare for the normal build/deployment path when applicable.
4. Runtime verification through remote/runtime tooling.

Remote Desktop Commander is reserved for a precise operation that genuinely requires access to the user's local/authorized computer and cannot reasonably be completed through the canonical repository or remote services.

Its absence, disconnection or failure is never by itself a project blocker. Do not retry it in a loop. Continue immediately through GitHub, Supabase, Cloudflare or other appropriate remote tooling.

Do not use Remote Desktop Commander merely to read or modify the canonical repository, administer Supabase, trigger the normal Cloudflare release path, audit remotely accessible code, or work around an already available connector.

If a tool instruction recommends local-file access, first determine whether the file is actually local-only. If GitHub or another remote service is the source of truth, use that source instead.
