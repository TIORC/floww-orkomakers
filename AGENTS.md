<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Event emails go through Resend from server code only (src/lib/emails.server.ts) and every attempt is logged in email_envios; keeps the key off the browser and gives an audit trail.
- Selected internal access policies authorize through protected account-linked `user_roles`, synchronized only from administrator-controlled employee records; signup metadata must never grant staff privileges.
- Run selected permission regressions against the exact migration in isolated PGlite with the captured baseline schema; this exercises database enforcement without changing production records.
