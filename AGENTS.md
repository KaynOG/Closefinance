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
- Use the shared ColorPicker for custom colors, because in-app accessible dialogs must replace browser-native color dialogs.
- Use AppSelect for themed option lists on financial entry and filter screens; it preserves option values and callbacks while replacing browser-native menus with accessible in-app menus.
- Use the shared IconPicker for all icon-selection grids and compact menus, so selection stays accessible and inherits the active theme without browser-native lists.
- Keep additional icon IDs and renderers in `extra-icons` and append them through IconPicker, so every picker offers the same additions and saved choices render consistently.
- Keep transaction history grouped by actual entries, actual expenses and derived invoice summaries; never add invoice summaries or invoice settlements to purchase totals, to avoid double counting.
- Keep static service and bank logos in the shared brand catalog as CDN asset pointers, with persisted catalog IDs on records and in backups, so logo choices survive reloads and restoration without runtime lookup services.
- Share six-group monthly budget calculations through `budget-goals`; persist category group links and month-specific plans on existing owner-scoped rows and include them in backup, because comparisons must remain consistent across devices and restoration.
- Use the shared income-allocation calculation for both budget target charts and tables, because percentages are weights, not monetary amounts, and cent rounding must preserve the distributed total.
- Keep saved/invested balances separate from monthly contributions in budget comparisons, because cumulative assets are not a month's income allocation; exclude invoice settlements and future transactions to prevent double counting and forecasts.

- Use AppDatePicker for all day and month fields, preserving local ISO values and callbacks, because date selection must stay themed and accessible inside app dialogs.
- Never auto-mark debt/receivable installments when their due date arrives and never pre-create their linked transactions: the transaction is created only when the user checks the installment box (and deleted when unchecked), because users must keep manual control over when expenses/incomes happen.
- Exclude installment-tagged transactions (`__dv__:`/`__rc__:`) from the load-time auto-debit/auto-credit pass, because those transactions only exist while the installment is checked and must not re-apply to bank balances.
