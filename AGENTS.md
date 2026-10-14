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

- Keep project target dates on `public.projects` and edit them from the project view, because deadlines belong to each project rather than its individual goals.
- Persist debt/receivable custom positions and archive status on their own rows and include them in backup restoration, so organization follows the account and survives remapped IDs.
- Share chronological/custom record ordering through `record-order` and `RecordOrderControls`, so debts and receivables keep identical sorting behavior.
- Use the asynchronous app-dialog service and root AppDialogHost for confirmations, alerts and prompts, so actions await accessible themed dialogs instead of browser dialogs.
- Edit debt and receivable installment dates and amounts through the existing store update APIs, so linked transactions and bank balances stay synchronized.
- Share audio preference changes through the sound module subscription API so floating and settings controls stay synchronized and muting stops active audio.
- Keep glass treatments and chart glow in shared semantic CSS tokens so every accent and light/dark mode inherits the same visual treatment.
