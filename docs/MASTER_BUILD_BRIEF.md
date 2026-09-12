Chaos Tournaments — Website Build 2

Build a production-ready, mobile-first website and tournament management platform for Chaos Tournaments.

The system must manage:

* Discord authentication  
* Player accounts  
* Team creation  
* Tournament registration  
* Grudge-match registration  
* Starting-player rosters  
* Substitutes, reserves, coaches, and managers  
* Entry-fee sponsorship  
* Split and batch entry payments  
* Payer ownership of winning-entry payouts  
* Stripe payments  
* Bracket generation  
* Tournament stacking  
* Match scheduling  
* Match results  
* Win/loss determination  
* Automatic bracket advancement  
* Disputes  
* Winner verification  
* Prize allocation  
* Payout-entitlement tracking  
* Refunds  
* Discord roles and communication  
* Administrative controls  
* Google Sheets reporting  
* n8n automations

The website must be designed primarily for mobile users while remaining fully functional on desktop.

## **1\. Core Technology Stack**

### **Frontend**

Use:

* Next.js  
* React  
* TypeScript  
* Mobile-first responsive design  
* Tailwind CSS or an equivalent styling system  
* Accessible navigation  
* Accessible forms  
* Large mobile touch targets  
* Clear loading states  
* Saved form progress  
* Server-side validation  
* Clear error messages

### **Backend and Database**

Use:

* Supabase  
* Supabase Postgres  
* Supabase Auth  
* Discord OAuth through Supabase Auth  
* Supabase Row Level Security  
* Supabase Storage  
* Supabase Edge Functions  
* Database transactions  
* Database constraints  
* Audit logs

Supabase Storage may be used for:

* Team logos  
* Match screenshots  
* Score evidence  
* Dispute evidence  
* Identity-verification documents when permitted  
* Administrative attachments

### **Payments**

Use:

* Stripe Checkout  
* Stripe webhooks  
* Stripe payment metadata  
* Multiple payments per team registration  
* Batch payment for multiple starter entries  
* Refund tracking  
* Chargeback tracking  
* Payout-entitlement records  
* Administrator-approved prize payouts  
* Future-ready Stripe Connect support

Do not automatically activate Stripe Connect until the business model and payout process are approved and configured.

### **Automation**

Use n8n for:

* Confirmation emails  
* Discord notifications  
* Registration reminders  
* Entry-payment reminders  
* Check-in reminders  
* Google Sheets synchronization  
* Administrative alerts  
* Result notifications  
* Dispute notifications  
* Tournament-full alerts  
* Payout-review alerts  
* Refund notifications

### **Other Integrations**

Use:

* Discord OAuth  
* Discord bot  
* Google Sheets will collect in supabase  
* Custom react registration form and Google Forms only for secondary or internal forms

Do not use Google Forms as the primary tournament registration system.

## **2\. Core Architecture Principle**

### **Website**

The website is the main interface for:

* Tournament discovery  
* Grudge-match discovery  
* Registration  
* Team creation  
* Roster management  
* Entry sponsorship  
* Entry payments  
* Payment-status tracking  
* Bracket viewing  
* Match scheduling  
* Check-in  
* Score reporting  
* Result confirmation  
* Dispute submission  
* Player dashboards  
* Captain dashboards  
* Sponsor dashboards  
* Administrative dashboards

### **Supabase**

Supabase is the official source of truth. Supabase stores:

* Users  
* Discord identities  
* Teams  
* Team memberships  
* Tournament registrations  
* Starting-player entry slots  
* Entry payers  
* Payout entitlements  
* Stripe payments  
* Refunds  
* Chargebacks  
* Tournaments  
* Brackets  
* Matches  
* Results  
* Disputes  
* Substitutions  
* Rankings  
* Prize allocations  
* Payouts  
* Audit events

### **Discord**

Discord is used for:

* Login identity  
* Community access  
* Tournament communication  
* Team communication  
* Match channels  
* Captain roles  
* Platform roles  
* Check-in reminders  
* Match notifications  
* Result notifications  
* Support  
* Dispute communication

Discord must not be the official database for:

* Payments  
* Entry ownership  
* Payout entitlements  
* Brackets  
* Match results  
* Refunds  
* Prize payouts

### **Stripe**

Stripe confirms entry-fee payments. A browser redirect must never mark an entry as paid. A verified Stripe webhook must update the appropriate paid-entry records in Supabase.

### **n8n**

n8n handles downstream automation. n8n must not be the only system responsible for:

* Confirming payment  
* Calculating payout ownership  
* Advancing bracket winners  
* Finalizing tournament results

### **Google Sheets**

Google Sheets is an administrative reporting mirror. Google Sheets must not be the authoritative database.

## **3\. Primary Mobile Player Journey**

The primary tournament-registration flow is:

1. User opens a tournament page.  
2. User taps Register.  
3. User logs in with Discord.  
4. User returns to the tournament page.  
5. User selects the correct platform division.  
6. User creates or selects a team.  
7. User adds starters, substitutes, reserves, coaches, and managers.  
8. System validates platform compatibility.  
9. System validates the required starting-player count.  
10. Each required starting-player entry becomes a payable entry slot.  
11. Users select which unpaid entries they want to pay.  
12. One person may pay one entry, several entries, or every entry.  
13. Multiple people may separately pay different entries.  
14. Stripe processes each payment.  
15. Stripe webhooks confirm which entries were paid.  
16. Registration becomes fully paid when every required starter entry is funded.  
17. Captain accepts tournament rules.  
18. Team completes check-in.  
19. Team receives bracket placement.  
20. Team plays its match.  
21. Result is submitted and confirmed.  
22. Winner advances automatically.  
23. When the tournament finishes, winning-entry payouts are allocated to the people who funded those entries.  
24. Administrator reviews and approves payouts.

Recommended registration success-screen buttons:

* Open Discord  
* Join Discord  
* View Tournament Dashboard  
* View Team Entries  
* View Bracket  
* Edit Roster  
* Sponsor Another Entry  
* View Rules

## **4\. Authentication**

Use Discord OAuth as the primary login system. Store:

```
user_id
supabase_auth_id
discord_user_id
discord_username
discord_display_name
discord_avatar_url
email
preferred_platform
created_at
updated_at
account_status
```

Players should not need to create a separate website username and password.

After Discord login, return the user to the page they originally opened. Examples:

```
/tournaments/[slug]
/tournaments/[slug]/register
/grudge-matches/[id]
/teams/[id]
/dashboard
/pay/[entry-link]
```

A user does not need to be a starting player to pay an entry. Eligible payers may include:

* Starting players  
* Substitutes  
* Reserves  
* Coaches  
* Managers  
* Team owners  
* Team supporters  
* Other registered Chaos Tournaments users

The initial build should require a registered Chaos Tournaments account before a person can own a payout entitlement. Guest Stripe payments should not be enabled unless the system can securely connect the guest payer to a verified payout-recipient account.

## **5\. Platform Compatibility Rules**

The platform must support separate PC and console divisions.

### **PC Division**

PC players may only:

* Join PC teams  
* Enter PC tournaments  
* Enter PC grudge matches  
* Challenge PC teams  
* Play against PC teams  
* Be placed into PC brackets

PC cannot compete against PS5 or Xbox.

### **Console Division**

PS5 and Xbox may cross-platform play. Console users may:

* Join mixed PS5 and Xbox teams  
* Enter console tournaments together  
* Play PS5-versus-Xbox matches  
* Participate in the same console bracket  
* Enter console grudge matches

Each console user's individual platform must be stored as `PS5` or `Xbox`. The team division must be stored as `Console`.

### **Compatibility Validation**

```
If tournament.division = PC:
    Every starter, substitute, and reserve must use PC.

If tournament.division = Console:
    Every starter, substitute, and reserve must use PS5 or Xbox.

If an incompatible player is present:
    Block registration.
    Identify the incompatible roster member.
    Explain how to correct the roster.
```

Platform compatibility must be validated before entry payment.

## **6\. Team, Roster, Sponsor, and Payer Roles**

Every team member must have one roster role: `starter`, `substitute`, `reserve`, `coach`, `manager`.

A user may also have a financial relationship to an entry: `entry_payer`, `entry_sponsor`, `payout_entitlement_holder`.

Roster role and financial role are separate. A person may be:

* A starter who pays their own entry  
* A starter who pays their own entry and other players' entries  
* A starter whose entry is paid by another person  
* A substitute who sponsors starting players  
* A reserve who sponsors starting players  
* A coach who sponsors starting players  
* A manager who sponsors starting players  
* A team supporter who sponsors starting players  
* A payer with no active playing role

### **Mandatory Sponsorship Rule**

Only starting-player positions require an entry fee. However, any authorized user may pay one or more starting-player entries. The person who pays an entry becomes the payout-entitlement holder for that paid entry.

If a team earns a winning placement, each entry's share of the team prize belongs to the person who paid that entry. This applies whether the payer is the starting player, another starting player, a substitute, a reserve, a coach, a manager, or another authorized sponsor.

### **Example**

A five-player team has five paid starting-player entries. Player A pays their own entry, Player B's entry, Player C's entry, and Player D's entry. Player E pays their own entry. Player A funded four entries; Player E funded one entry.

If the team wins a prize, Player A receives Player A's entry share plus Player B's, Player C's, and Player D's sponsored entry shares. Player E receives Player E's entry share. Players B, C, and D do not receive those entry shares because Player A funded their entries.

### **Non-Player Sponsor Example**

A registered substitute pays the entries for three starting players. The substitute does not pay an entry for being a substitute — they pay three starting-player entry fees as a sponsor. If the team earns a winning placement, the substitute receives the three prize shares connected to those three funded entries.

### **Core Ownership Rule**

The starting player occupies the competitive entry slot. The payer funds the entry slot. The payout-entitlement holder owns the prize share attached to that entry slot.

By default: `payout_entitlement_holder = entry_payer`.

Changing the player assigned to a funded slot does not automatically change the payout-entitlement holder.

## **7\. Starting-Player Entry Slots**

Do not treat a team registration as one undivided payment obligation. Create one payable entry slot for every required starting-player position.

Example for a five-player tournament: Entry Slot 1 through Entry Slot 5\.

Each slot should contain:

```
entry_slot_id
registration_id
slot_number
assigned_starter_user_id
entry_fee_amount
currency
payment_status
checkout_lock_status
checkout_lock_expires_at
payer_user_id
payment_id            -- denormalized cache of the funding payment; see Section 52
payout_entitlement_user_id
entitlement_status
funded_at
locked_at
created_at
updated_at
```

> **Note:** `payment_id` is a read-optimization field only. The `payment_entry_allocations` table (Section 52\) is the authoritative record of which payment funded which slot(s); `payment_id` must be written in the same transaction as its allocation row and never updated independently.

Suggested entry-slot payment statuses:

```
unpaid
checkout_pending
paid
payment_failed
refunded
partially_refunded
chargeback_pending
charged_back
waived
admin_review
```

Suggested entitlement statuses:

```
pending
active
locked
payout_pending
paid_out
transferred
cancelled
forfeited
admin_review
```

The entry fee and payout entitlement must be attached to the entry slot rather than permanently attached to the player assigned to the slot.

## **8\. Entry-Fee Calculation**

Only required starting-player positions are included in the entry-fee requirement. The following roster roles do not create an entry-fee obligation merely by being registered: substitute, reserve, backup, alternate, coach, manager.

```
total_required_entry_fees =
required_starting_players × entry_fee_per_starting_player
```

Example: 5 required starters, 2 registered substitutes, $20 entry fee per starter → 5 required paid entry slots, $100 total team registration requirement. The two substitutes do not create additional entry fees, but may pay or sponsor any of the five required starting-player entries.

### **Payment Flexibility**

Allow one payer to fund one entry, multiple entries, or every entry; allow several payers to split entries; allow a starter, substitute, coach, or manager to fund other starters. Do not require the captain to pay the entire team fee.

### **Registration Payment Completion**

```
If paid_entry_count < required_starting_player_count:
    registration payment status = partially funded

If paid_entry_count = required_starting_player_count:
    registration payment status = fully funded

If paid_entry_count > required_starting_player_count:
    reject additional payment
```

Suggested team-level payment statuses:

```
unfunded
partially_funded
fully_funded
payment_mismatch
refund_pending
partially_refunded
refunded
chargeback_review
admin_review
```

## **9\. Entry Selection and Checkout**

The payment interface must show every required starting-player entry. Example:

```
Player A — Paid by Player A
Player B — Unpaid
Player C — Unpaid
Player D — Paid by Coach X
Player E — Unpaid
```

An authorized payer may select one or more unpaid entries. Example interface:

```
[ ] Player B entry — $20
[ ] Player C entry — $20
[ ] Player E entry — $20
```

The payer may select all three and make one $60 Stripe payment.

### **Checkout Locking**

1. Temporarily lock the selected entry slots.  
2. Prevent another person from paying the same entries.  
3. Create the Stripe Checkout Session.  
4. Set an expiration time for the checkout lock.  
5. Release the lock if checkout expires or fails.  
6. Mark the entries paid only after a verified webhook.

Suggested lock statuses: `available`, `locked_for_checkout`, `paid`, `expired`, `released`.

A checkout session should not permanently reserve entries if payment is abandoned.

## **10\. Stripe Checkout Metadata**

Each Stripe Checkout Session should include:

```
tournament_id
registration_id
team_id
payer_user_id
payer_discord_user_id
entry_slot_ids
entry_slot_count
entry_fee_per_slot
checkout_total
division
registration_type
currency
```

When one person pays several entries, include all funded entry-slot IDs. Example:

```
entry_slot_ids = [slot_2, slot_3, slot_4]
entry_slot_count = 3
entry_fee_per_slot = 20.00
checkout_total = 60.00
```

The server must calculate the amount. Never trust entry quantities submitted only by the browser, browser-calculated totals, browser-submitted payer ownership, or client-side payout-entitlement assignments.

## **11\. Stripe Webhook Processing**

Use a Supabase Edge Function or secure backend endpoint. On `checkout.session.completed`:

1. Verify the Stripe signature.  
2. Load the Checkout Session.  
3. Verify the payer.  
4. Verify the entry-slot IDs.  
5. Verify that the Stripe total equals the server-calculated total.  
6. Verify that the entry slots are still eligible for payment.  
7. Record the payment.  
8. Mark each selected entry slot as paid.  
9. Record the payer on each entry.  
10. Set payout entitlement to the payer.  
11. Mark the entitlement active.  
12. Release checkout locks.  
13. Recalculate team funding status.  
14. Mark registration fully funded when all entry slots are paid.  
15. Trigger n8n notifications.  
16. Update Google Sheets.  
17. Write an audit event.

Use a database transaction so that every selected entry is funded together.

If payment verification fails:

```
entry_slot.status = admin_review
payment.status = payment_mismatch
registration.status = payment_review
```

## **12\. Payment and Entitlement Ownership**

For every paid entry slot, store:

```
competitive_player = assigned_starter_user_id
financial_payer = payer_user_id
payout_owner = payout_entitlement_user_id
```

By default: `payout_owner = financial_payer`. The competitive player does not automatically receive the winning share when another person paid the entry.

### **Payout Ownership Example from Prize Pool**

A tournament has 32 teams. Each team has five players. Each starting player requires a $5 entry, for a total of $25 per team. 20% of the total entry money (32 × $25 \= $800) goes to the business for operations: $160. The remaining 80% goes to the prize pool: $640.

Round payouts to multiples of $5 if possible, otherwise $10 (see `prize_rounding_increment` in Section 24).

* First place: 70.3% of the prize pool \= $450  
* Second place: 29.7% of the prize pool \= $190

The first-place team wins a $450 first-place team prize, divided into five equal entry shares:

```
$450 ÷ 5 = $90 per paid entry
```

The second-place team wins a $190 second-place team prize:

```
$190 ÷ 5 = $38 per paid entry (rounding remainder handled per Section 35)
```

Admins need control over: team count, entry fee, operations percentage, prize split percentage, and rounding preference ($5 or $10). These live in `tournament_settings` (Section 24).

### **Separate Illustration — Larger Prize Pool**

For tournaments with a larger flat prize (used again in Section 35's payout-calculation walkthrough): a $1,000 first-place prize in a five-player tournament divides into:

```
$1,000 ÷ 5 = $200 per paid entry
```

Payment ownership: Player A funded 4 entries, Player E funded 1 entry.

Payout ownership: Player A receives 4 × $200 \= $800. Player E receives 1 × $200 \= $200.

### **Non-Player Sponsor Example**

A coach pays for three starting-player entries. The team wins a $1,000 prize in a five-player tournament. Each entry share is $200. The coach receives 3 × $200 \= $600. The payers of the remaining two entries receive $200 each.

The players occupying sponsored slots do not receive those shares unless the payout-entitlement holder validly transfers the entitlement under an approved system process.

## **13\. Prize Allocation Logic**

Each tournament must define how placement prizes are allocated. Recommended initial method:

```
entry_share_value =
team_placement_prize ÷ required_starting_player_count

payer_payout =
number_of_winning_entries_funded_by_payer × entry_share_value
```

Examples of winning placements may include `first_place`, `second_place`. Chaos Tournaments currently expects at least `first_place` and `second_place`. Each tournament should have configurable prize values: `first_place_prize`, `second_place_prize`, `third_place_prize`.

The prize-allocation method should also be configurable: `equal_per_entry`, `custom_percentage`, `fixed_per_entry`, `manual_admin_allocation`.

For the initial production version, implement `equal_per_entry`. Do not divide prize shares based on maps played, number of matches played, starter versus substitute participation, who scored the most, or who occupied the slot at the end. Prize ownership is based on funded entry entitlement.

## **14\. Entitlement Locking**

Payout entitlements should become locked before the tournament begins. Recommended lock point: tournament check-in close, or official roster lock (configurable per tournament).

After entitlement lock:

* Players cannot change the payer.  
* Captains cannot move payout ownership.  
* Sponsors cannot reassign shares through the normal interface.  
* Admin approval is required for corrections.  
* Every change must be audited.

Store: `entitlement_locked_at`, `entitlement_locked_by`, `entitlement_lock_reason`.

The system must clearly show each payer what they own before the lock deadline.

## **15\. Optional Entitlement Transfer**

The initial production version may disable entitlement transfers. If transfers are later enabled, require payer authentication, recipient authentication, explicit acceptance, admin review when required, transfer timestamp, audit log, and tournament lock validation.

Suggested transfer statuses: `requested`, `accepted`, `declined`, `cancelled`, `approved`, `completed`, `rejected`.

A captain must not be able to transfer another person's payout entitlement.

## **16\. Refund Logic**

Refunds must return to the original payer of each entry. Do not automatically refund the team captain unless the captain was the original payer.

Examples: starter paid their own entry → refund starter. Coach paid three entries → refund coach for those three entries. Substitute paid one entry → refund substitute. Captain paid all entries → refund captain.

Store refund records by entry slot:

```
refund_id
payment_id
entry_slot_id
payer_user_id
refund_amount
reason
status
stripe_refund_id
requested_at
approved_at
processed_at
```

Suggested statuses: `requested`, `under_review`, `approved`, `processing`, `completed`, `failed`, `rejected`.

For a partial team refund, refund only the affected entry slots or proportional amounts.

## **17\. Chargebacks and Failed Payments**

If a payer disputes or reverses a payment:

1. Mark the affected entry slots under chargeback review.  
2. Notify the team captain.  
3. Notify the payer.  
4. Recalculate the team's funding status.  
5. Put registration on payment hold when necessary.  
6. Block check-in if required entries are no longer funded.  
7. Require replacement payment or admin resolution.  
8. Freeze payout entitlements connected to the disputed payment.

Suggested statuses: `chargeback_pending`, `chargeback_won`, `chargeback_lost`, `replacement_payment_required`, `resolved`.

A chargeback on one sponsored entry should not incorrectly change ownership of unrelated funded entries.

## **18\. Team and Roster Database Structure**

**Teams**

```
team_id
team_name
team_slug
team_logo_url
captain_user_id
division
status
created_at
updated_at
```

**Team Members**

```
team_member_id
team_id
user_id
roster_role
platform
game_username
is_confirmed
is_active
joined_at
removed_at
```

**Registration Rosters**

```
registration_roster_id
registration_id
team_member_id
assigned_role
starter_slot_number
eligibility_status
confirmation_status
locked_at
created_at
updated_at
```

Roster role and entry-payment ownership must remain separate.

## **19\. Starting Roster Requirements**

Each tournament should specify: `required_starting_players`, `maximum_substitutes`, `maximum_reserves`, `maximum_coaches`, `maximum_managers`.

Example: Required starters: 5\. Maximum substitutes: 2\. Maximum reserves: 1\. Maximum coaches: 1\. Maximum managers: 1\.

Registration validation:

```
If starter_count < required_starting_players:
    Block final registration.
    Allow roster draft.
    Block tournament approval.

If starter_count = required_starting_players:
    Create or maintain required entry slots.

If starter_count > required_starting_players:
    Block registration.
    Require extra players to be redesignated.
```

All required starter slots must be assigned and funded before the team becomes fully approved.

## **20\. Starter Changes and Substitutions**

The paid entry belongs to the entry slot. The payout entitlement belongs to the payer. The competitive player assigned to the slot may change under tournament rules.

Example: Entry Slot 2 — original starter Player B, payer Coach X, payout owner Coach X. Player B becomes unavailable; a registered substitute replaces Player B. Updated slot: new active player Substitute Y, payer Coach X, payout owner Coach X. No additional entry fee is required because the slot was already funded. Substitute Y does not gain the payout entitlement merely by entering the lineup.

**Before Roster Lock:** Captains may replace starters when the replacement is eligible, platform matches, the team remains within roster limits, and no duplicate-team conflict exists.

**After Roster Lock:** Require admin approval.

Store:

```
substitution_id
tournament_id
registration_id
team_id
entry_slot_id
match_id
outgoing_player_id
incoming_player_id
reason
requested_by
requested_at
approved_by
approved_at
status
```

## **21\. Match Roster Logic**

Before each match, the captain selects the active lineup. For a five-player tournament: exactly 5 active players, remaining substitutes and reserves inactive. Active players must come from registered starters, substitutes, or reserves when allowed.

The system must not change payout ownership when the active lineup changes. Store a match roster snapshot:

```
match_roster_snapshot_id
match_id
team_id
entry_slot_id
active_player_user_id
roster_role_at_match
payer_user_id
payout_entitlement_user_id
captured_at
```

This preserves both who competed and who owned the financial entitlement.

## **22\. Tournament Registration Statuses**

```
draft
awaiting_roster
awaiting_entry_funding
partially_funded
fully_funded
pending_review
approved
checked_in
seeded
active
eliminated
winner
runner_up
disqualified
withdrawn
refund_pending
refunded
payment_review
```

A team may enter a production bracket only when `registration_status = approved`, `roster_status = complete`, `platform_status = valid`, `funding_status = fully_funded`, and `check_in_status = checked_in`.

## **23\. Grudge-Match Payment and Sponsorship**

Apply the same funded-entry model to grudge matches.

For team grudge matches: each required starting-player position creates an entry slot; any authorized user may fund one or more entries; entry payout rights belong to the payer; all required entries on both sides must be funded before the match becomes active.

For a one-versus-one grudge match: each competitor has one entry slot; the competitor may pay their own entry; another authorized user may sponsor the competitor; if the sponsored competitor wins, the payout entitlement belongs to the sponsor who funded the winning entry.

Recommended statuses: `draft`, `challenge_sent`, `opponent_accepted`, `opponent_declined`, `awaiting_entry_funding`, `partially_funded`, `fully_funded`, `scheduled`, `in_progress`, `awaiting_result`, `awaiting_confirmation`, `disputed`, `completed`, `cancelled`, `refund_pending`, `refunded`.

PC may only challenge PC. Console may support PS5 versus PS5, Xbox versus Xbox, PS5 versus Xbox.

## **24\. Tournament Structure**

Each tournament should contain:

```
tournament_id
name
slug
description
game_id
division
format
team_size
required_starting_players
maximum_substitutes
maximum_reserves
minimum_teams
maximum_teams
bracket_size
best_of
third_place_match
entry_fee_per_starting_slot
prize_allocation_method
first_place_prize
second_place_prize
third_place_prize
registration_open_at
registration_close_at
payment_deadline
check_in_open_at
check_in_close_at
roster_lock_at
entitlement_lock_at
starts_at
estimated_match_minutes
round_buffer_minutes
maximum_concurrent_matches
status
rules_version
created_at
updated_at
```

### **`tournament_settings` (new — houses configurable business rules referenced throughout this brief)**

```
tournament_id
operations_fee_percentage          -- Section 12
prize_rounding_increment           -- $5 or $10, Section 12
remainder_allocation_rule          -- e.g. remainder_to_team_captain_entry_payer, Section 35
remainder_fallback_rule            -- earliest_funded_entry_payer, Section 35
double_no_show_policy              -- advance_neither | advance_designated_team | award_bye_to_next_opponent | reschedule_match | void_match, Section 39
auto_confirmation_enabled
auto_confirmation_window_minutes
auto_confirmation_value_threshold  -- Section 31: require explicit/admin confirmation above this prize value
allow_payer_to_sponsor_opposing_teams  -- default false, Section 41
created_at
updated_at
```

Any rule described elsewhere in this brief as "configurable" or "admin-controlled" must be backed by a field in `tournament_settings` (or a platform-wide `platform_settings` table for defaults that apply across tournaments) rather than hard-coded in application code.

Supported formats: `single_elimination`, `double_elimination`, `round_robin`, `group_stage_to_elimination`. Fully implement single elimination first as default. Architect the database so additional formats can be added later.

## **25\. Single-Elimination Bracket Logic**

In single elimination: a winner advances, a loser is eliminated, the final winner becomes champion and first-place team to receive payout, the final loser becomes runner-up and second-place team to receive payout. Every completed contested match has one winner and one loser. A disputed match cannot advance.

### **Number of Rounds**

```
4 teams = 2 rounds
8 teams = 3 rounds
16 teams = 4 rounds
32 teams = 5 rounds
64 teams = 6 rounds

rounds = log2(bracket_size)
```

### **Round Names**

Eight-team tournament: Quarterfinals, Semifinals, Championship. Sixteen-team tournament: Round of 16, Quarterfinals, Semifinals, Championship. Thirty-two-team tournament: Round of 32, Round of 16, Quarterfinals, Semifinals, Championship.

## **26\. Bracket Size and Byes**

Use the next power of two equal to or greater than the number of eligible teams.

```
5–8 teams = 8-team bracket
9–16 teams = 16-team bracket
17–32 teams = 32-team bracket
33–64 teams = 64-team bracket
```

### **Bye Logic**

Example: 13 teams, 16 bracket slots, 3 empty slots, 3 byes. Represent a bye as:

```
match_status = completed
result_type = bye
winner_team_id = populated_team
loser_team_id = null
```

Highest-seeded teams receive byes first. Distribute byes across the bracket. A bye does not change entry ownership, payout entitlement, number of funded entries, or prize-share count.

## **27\. Team Seeding**

Support: `random`, `registration_order`, `manual`, `ranking_based`, `performance_based`, `hybrid`. Recommended default: `hybrid`.

Use, in order: tournament points, historical win percentage, previous placements, recent performance, registration time, random tie-breaker. Top seeds should be separated across the bracket.

## **28\. Match Database Structure**

```
match_id
tournament_id
bracket_id
round_number
round_name
match_number
bracket_position
team_1_id
team_2_id
team_1_source_match_id
team_2_source_match_id
scheduled_at
started_at
completed_at
best_of
team_1_score
team_2_score
winner_team_id
loser_team_id
status
result_type
next_match_id
next_match_slot
reported_by_user_id
confirmed_by_user_id
dispute_status
admin_notes
version_number
created_at
updated_at
```

Match statuses: `pending`, `awaiting_teams`, `ready`, `scheduled`, `check_in_open`, `in_progress`, `awaiting_result`, `awaiting_confirmation`, `disputed`, `completed`, `forfeit`, `cancelled`, `void`.

Result types: `normal`, `forfeit`, `bye`, `disqualification`, `admin_decision`, `no_show`, `technical_failure`.

## **29\. Match Readiness**

```
If team_1_id exists and team_2_id exists:
    status = ready

If one team exists and the other slot is a confirmed bye:
    advance the populated team

If feeder matches are incomplete:
    status = awaiting_teams
```

Example: Match 1 winner → Match 9 slot 1\. Match 2 winner → Match 9 slot 2\.

## **30\. Best-of Match Validation**

Support Best of 1, Best of 3, Best of 5\.

```
required_wins = floor(best_of / 2) + 1
```

Required wins: Bo1 \= 1, Bo3 \= 2, Bo5 \= 3\.

Valid examples: Bo3 2–0, Bo3 2–1, Bo1 1–0, Bo5 3–0, Bo5 3–1, Bo5 3–2. Reject: Bo3 1–1, Bo3 3–1, Bo1 2–0.

## **31\. Result Submission**

Use a two-party confirmation process.

**Captain Submission** collects: screenshot of scoreboard, winning team, final series score, map scores, match ID, opponent.

**Opponent Response** allows confirmation or `dispute_result`.

**Finalization:** when confirmed, `match.status = completed`, `winner_team_id = winner`, `loser_team_id = loser`, then advance the winner.

**Auto-Confirmation:** allow configurable auto-confirmation only when evidence is uploaded, no dispute is filed, both teams checked in, no anti-cheat flag exists, and the confirmation period expires. Tournaments with placement prizes above `auto_confirmation_value_threshold` (Section 24\) require explicit or administrative confirmation regardless of the auto-confirmation window.

## **32\. Automatic Advancement**

When a result is finalized:

1. Lock current match.  
2. Save winner.  
3. Save loser.  
4. Mark losing registration eliminated.  
5. Find next match.  
6. Find destination slot.  
7. Insert winner.  
8. Check next-match readiness.  
9. Notify both teams.  
10. Update bracket.  
11. Write audit log.

```
finalize_match(match_id):

    load match

    verify match is not completed
    verify score is valid
    verify winner belongs to match
    verify loser belongs to match
    verify no unresolved dispute exists

    begin database transaction

        update match:
            status = completed
            winner_team_id = winner
            loser_team_id = loser
            completed_at = current timestamp

        update loser registration:
            status = eliminated

        if next_match_id exists:

            load next match

            if next_match_slot = 1:
                next_match.team_1_id = winner_team_id

            if next_match_slot = 2:
                next_match.team_2_id = winner_team_id

            if both next-match teams exist:
                next_match.status = ready

        else:

            winner registration.status = winner
            loser registration.status = runner_up
            tournament.status = completed
            bracket.status = completed

    commit transaction
```

Bracket advancement must not alter entry-payment or payout-entitlement records.

## **33\. Duplicate-Advancement Protection**

Use unique constraints, idempotency keys, database transactions, match locks, version numbers, and completed-match restrictions.

Unique advancement key: `source_match_id`, `destination_match_id`, `destination_slot`.

A completed match cannot finalize twice unless an administrator reopens it.

## **34\. Tournament Completion and Payout Creation**

When the championship match completes:

```
winner registration = winner
loser registration = runner_up
tournament = completed
bracket = completed
```

Then: lock bracket, publish champion, publish runner-up, calculate placement prizes, calculate per-entry prize shares, group winning entries by payout-entitlement holder, create payout records, update rankings, update team statistics, notify Discord, sync Google Sheets and Supabase, place payouts into administrative review.

Do not issue payouts merely because a score was entered. Required payout workflow: `results_verified`, `entitlements_verified`, `recipient_verified`, `payout_approved`, `payout_processing`, `payout_sent`.

## **35\. Payout Calculation**

For each winning placement:

```
entry_share_value =
placement_prize ÷ required_starting_player_count

payout_amount =
winning_entry_count_owned × entry_share_value
```

**First-Place Example:** First-place team prize $1,000, required starting entries 5, entry share $200. Player A funded 4 entries, Player E funded 1 entry. Payouts: Player A $800, Player E $200.

**Second-Place Example:** Second-place team prize $500, required starting entries 5, entry share $100. If a coach funded three entries: coach $300, other entry payer 1 $100, other entry payer 2 $100.

**Rounding:** Use integer cents. If a prize does not divide evenly:

1. Calculate each equal share in cents.  
2. Assign any remainder according to a configurable rule.  
3. Record the adjustment.

Recommended remainder rule: `remainder_to_team_captain_entry_payer`. **Fallback:** if the captain did not personally fund any winning entry, assign the remainder to the earliest-funded entry payer (by `funded_at` timestamp) instead. Alternative rule: `remainder_to_first_entry_slot`. Make this configurable (`remainder_allocation_rule` / `remainder_fallback_rule`, Section 24\) and auditable.

Note: this per-cent remainder rule is a separate, later step from the prize-pool rounding to $5/$10 described in Section 12 — the placement prize itself is rounded to a clean dollar amount first (admin-configured `prize_rounding_increment`), then that already-rounded prize is split into per-entry shares to the cent using the rule above.

## **36\. Payout Records**

```
payout_id
tournament_id
registration_id
team_id
placement
recipient_user_id
winning_entry_count
entry_share_value
gross_payout_amount
adjustment_amount
net_payout_amount
status
approved_by
approved_at
payment_method
external_payout_id
sent_at
failure_reason
created_at
updated_at
```

Also store payout line items:

```
payout_line_item_id
payout_id
entry_slot_id
payout_entitlement_user_id
share_amount
created_at
```

This allows every payout dollar to be traced to a funded entry.

## **37\. Payout Dashboard**

Each payer should see: entries funded, team connected to each entry, starting player assigned to each entry, tournament, entry-payment status, payout-entitlement status, locked or unlocked status, potential first-place share, potential second-place share, actual placement, calculated payout, payout-review status, payout-sent status, refund status.

Use clear language: "You funded this entry." / "You own the payout share connected to this entry." Do not display language suggesting the sponsored player owns the payout.

## **38\. Team Win/Loss Statistics**

Track: `matches_played`, `matches_won`, `matches_lost`, `series_won`, `series_lost`, `maps_won`, `maps_lost`, `tournaments_entered`, `tournaments_won`, `runner_up_finishes`, `semifinal_finishes`, `quarterfinal_finishes`, `forfeit_wins`, `forfeit_losses`, `current_win_streak`, `longest_win_streak`, `ranking_points`.

When a match is finalized:

```
Winner:
    matches_played += 1
    matches_won += 1
    current_win_streak += 1

Loser:
    matches_played += 1
    matches_lost += 1
    current_win_streak = 0
```

Suggested tournament points: Champion 100, Runner-up 70, Semifinalist 45, Quarterfinalist 25, Round of 16 10, Completed participation 5, Forfeit loss 0, Disqualification 0 or negative. Make values configurable.

Team statistics and financial payout ownership must remain separate.

## **39\. Forfeits and No-Shows**

A team may lose automatically if it misses check-in, misses match-start deadline, uses an ineligible player, fields an invalid roster, refuses to play, violates rules, or is disqualified.

Forfeit score: Bo1 \= 1–0, Bo3 \= 2–0, Bo5 \= 3–0. The winner advances normally.

If the winning team later earns a placement prize, its existing entry-entitlement ownership remains valid. A player who did not personally play because of a bye or opponent forfeit does not lose the funded entry entitlement.

For double no-show, use the tournament's configured `double_no_show_policy` (Section 24): `advance_neither`, `advance_designated_team`, `award_bye_to_next_opponent`, `reschedule_match`, `void_match`.

## **40\. Tournament Stacking**

Support multiple simultaneous tournaments without mixing data. Examples: PC and console tournaments at the same time, several console tournaments on one weekend, beginner and advanced tournaments, qualifiers feeding a championship, simultaneous matches, tournament seasons, multiple payment groups, multiple payout groups.

Every tournament needs a unique tournament\_id, bracket\_id, division, schedule, rules, Discord role, Discord category, payment configuration, prize configuration, and payout-entitlement configuration.

Entry payments and payout entitlements must always remain connected to the correct tournament registration.

## **41\. Conflict Detection**

Before registration or check-in, check existing player registrations, team registrations, match schedules, tournament schedules, platform division, roster membership, active-team conflicts, and maximum simultaneous entries.

Rules:

* A player may represent only one team in the same tournament.  
* A player cannot play in two overlapping matches.  
* A team cannot check in for overlapping tournaments without admin override.  
* A payer may sponsor entries in multiple tournaments.  
* A payer may sponsor entries for multiple teams unless prohibited by tournament rules.  
* Financial sponsorship does not make the payer an active player.

### **Opposing-Team Sponsorship Policy (resolved)**

Because sponsorship across opposing teams may create a conflict of interest, this policy is configurable via `allow_payer_to_sponsor_opposing_teams` (Section 24), recommended default `false`.

Definition used by the default rule: since single-elimination pairings aren't known until seeding, "opposing teams" is evaluated as **any two teams entered in the same tournament** — not specifically teams drawn into the same match. In practice: when a payer attempts to fund an entry on Team B while already holding an active entitlement on Team A in the same tournament, and the setting is `false`, block the payment and flag the attempt for admin review.

If a narrower, match-level interpretation (blocking only sponsorship across teams actually scheduled to face each other) is preferred later, that requires re-checking existing entitlements at seeding time rather than at payment time, since the opponent isn't known in advance — treat this as a distinct, more complex feature rather than the default behavior.

## **42\. Concurrent Match Scheduling**

A tournament may run multiple matches simultaneously. For a sixteen-team bracket: Round of 16 matches 1–8 may run concurrently; Quarterfinals matches 9–12 may run concurrently; Semifinals matches 13–14 may run concurrently; Championship match 15 follows both semifinals.

Scheduling inputs: `maximum_concurrent_matches`, available admins, available stream slots, `estimated_match_minutes`, result confirmation buffer minutes, `round_buffer_minutes`. Do not schedule more simultaneous matches than capacity allows.

## **43\. Qualifier Bracket Stacking**

Support qualifier brackets feeding championship brackets. Example:

```
Qualifier A winner → Championship semifinal 1 slot 1
Qualifier B winner → Championship semifinal 1 slot 2
Qualifier C winner → Championship semifinal 2 slot 1
Qualifier D winner → Championship semifinal 2 slot 2
```

Store: `source_bracket_id`, `source_placement`, `destination_bracket_id`, `destination_match_id`, `destination_slot`, `qualification_rule`.

Qualification rules: `bracket_winner`, `bracket_runner_up`, `top_two`, `points_leader`, `wild_card`, `admin_selection`.

PC qualifiers may only feed PC championships. Console qualifiers may only feed console championships.

### **Entry-Fee Carryover (resolved)**

If a qualifier and championship use the same entry fee and the qualifying team's slots are still within the same registration/entitlement scope, no new entry slots are required. If the qualifier and championship use **separate or different entry fees** (the common case), advancing a team automatically creates a new registration and a fresh set of entry slots in the destination bracket, seeded with the advancing team pre-placed into its bracket position. Those new entry slots start as `unpaid` and must be funded (by the same or different payers — payer identity is not required to carry over) before the team is treated as fully funded for the championship. The qualifier-stage entitlements are unaffected and remain tied to the qualifier's own placement prizes, if any.

## **44\. Disputes**

When a dispute opens: `match.status = disputed`, `dispute.status = open`, automatic advancement paused.

Store:

```
dispute_id
match_id
submitted_by_team_id
submitted_by_user_id
reason
description
evidence_urls
submitted_at
assigned_admin_id
resolution
resolved_at
admin_notes
```

Resolutions: `original_result_upheld`, `result_reversed`, `match_replay`, `partial_replay`, `team_disqualified`, `double_forfeit`, `admin_score`, `match_voided`.

Only advance after resolution. A result reversal may change which team receives placement payouts, but it must not change who funded the entries on either team.

## **45\. Admin Dashboard**

Build filters for: tournament, division, PC, console, PS5, Xbox, paid entries, unpaid entries, partially funded teams, fully funded teams, entry payer, payout-entitlement holder, payment mismatch, chargeback review, checked in, not checked in, roster complete, roster incomplete, team approved, team pending review, match ready, match in progress, awaiting result, disputed, eliminated, winner, runner-up, payout pending, payout approved, payout sent, refund pending, refund completed.

Admin actions: approve registration, reject registration, edit tournament, open registration, close registration, lock roster, unlock roster, approve substitution, review entry sponsorship, correct payer assignment, lock payout entitlements, review entitlement transfer, seed bracket, regenerate test bracket, start tournament, schedule match, enter result, reverse result, resolve dispute, issue forfeit, disqualify team, reopen match, repair bracket, approve refund, process refund, approve payout, mark payout sent, review chargeback, export data.

Every sensitive action must create an audit record.

## **46\. Player Dashboard**

Show: upcoming tournaments, active registrations, teams, roster role, starting or substitute status, entry payment status, who paid their entry, entries they personally funded, payout shares they own, match schedule, bracket position, check-in status, pending result confirmations, grudge-match challenges, win/loss record, ranking points, Discord status.

## **47\. Captain Dashboard**

Show: teams managed, roster members, starter count, substitute count, platform eligibility, required entry slots, paid entry slots, unpaid entry slots, payer for each entry, payout owner for each entry, team funding percentage, registration status, check-in controls, active match lineup, result submission, confirmation requests, substitution requests, disputes, tournament history.

The captain may invite others to pay unpaid entries. The captain may not redirect another payer's payout entitlement.

## **48\. Sponsor and Payer Dashboard**

Create a dedicated payer or sponsor view. Show: entries available to sponsor, entries currently locked for checkout, entries successfully funded, starting player connected to each funded entry, team connected to each entry, tournament connected to each entry, amount paid, potential prize share, entitlement lock date, refund status, chargeback status, actual payout amount, payout status.

Allow the payer to download or view: payment receipt, entry sponsorship confirmation, payout-entitlement summary, refund confirmation, payout confirmation.

## **49\. Discord Bot and Role Logic**

Platform roles: PC, PS5, Xbox.

Tournament roles: Registered, Fully Funded, Checked In, Team Captain, Starter, Substitute, Reserve, Coach, Manager, Entry Sponsor, Tournament Competitor, Tournament Winner, Tournament Runner-Up.

Event-specific roles: Chaos Cup Competitor, Summer Showdown Competitor, Friday Night Grudge.

Suggested commands: `/checkin`, `/roster`, `/entries`, `/payment-status`, `/sponsor-entry`, `/match`, `/bracket`, `/report-score`, `/confirm-score`, `/dispute`, `/request-admin`, `/accept-grudge`, `/decline-grudge`, `/match-status`, `/rules`.

Do not expose sensitive payout amounts publicly in Discord.

## **50\. Google Forms and Google Sheets**

Use Google Forms for: incident reports, player feedback, sponsor inquiries, volunteer applications, dispute-evidence backup, internal forms, emergency registration backup.

Use Google Sheets for: registrations, entry-slot payment status, entry payers, payout-entitlement holders, fully funded teams, partially funded teams, rosters, check-in lists, match results, tournament capacity, refund tracking, chargeback tracking, payout review, accounting exports, administrative reports.

Supabase remains the source of truth. Sensitive financial information should be limited in Google Sheets based on staff permissions.

## **51\. Security Requirements**

Implement: Supabase Row Level Security, server-side entry-price calculation, server-side prize-share calculation, Stripe webhook-signature verification, authorization checks, Discord identity validation, rate limiting, secure uploads, file restrictions, audit logs, database constraints, transactional bracket advancement, transactional entry funding, idempotent webhooks, duplicate-registration protection, duplicate-payment protection, duplicate-entry-funding protection, duplicate-advancement protection, duplicate-payout protection, server-side eligibility checks, server-side entitlement ownership, entitlement locking, payout approval controls.

Captains may edit only teams they control. Payers may view their own financial records. Players may view who paid their entry when permitted by tournament policy. Public brackets must not expose private payment or payout information.

## **52\. Suggested Database Tables**

Create or plan for:

```
users
user_profiles
discord_accounts
games
platforms
teams
team_members
team_invitations
tournaments
tournament_settings          -- new, see Section 24
tournament_rules
tournament_registrations
registration_rosters
registration_entry_slots
entry_checkout_locks
payments
payment_entry_allocations     -- authoritative payment↔entry_slot relationship, see Section 7
payment_events
payout_entitlements
entitlement_transfers
refunds
chargebacks
brackets
bracket_slots
matches
match_maps
match_results
match_evidence
match_confirmations
match_roster_snapshots
substitutions
check_ins
grudge_matches
grudge_match_participants
disputes
rankings
team_statistics
player_statistics
seasons
season_points
prize_allocations
payouts
payout_line_items
notifications
discord_role_assignments
automation_events
audit_logs
```

Use foreign keys, unique constraints, created/updated timestamps, soft-delete fields where appropriate, status enums or validated status tables, integer cents for money, and transaction-safe service functions.

## **53\. Core Pages**

```
/
/tournaments
/tournaments/[slug]
/tournaments/[slug]/register
/tournaments/[slug]/entries
/tournaments/[slug]/bracket
/tournaments/[slug]/standings
/grudge-matches
/grudge-matches/create
/grudge-matches/[id]
/teams
/teams/create
/teams/[id]
/teams/[id]/roster
/teams/[id]/entries
/pay/[entry-link]
/dashboard
/dashboard/player
/dashboard/captain
/dashboard/sponsor
/dashboard/payments
/dashboard/payouts
/login
/auth/callback
/payment/success
/payment/cancelled
/registration/success
/registration/cancelled
/rules
/support
/admin
/admin/tournaments
/admin/registrations
/admin/entry-slots
/admin/payments
/admin/entitlements
/admin/brackets
/admin/matches
/admin/disputes
/admin/refunds
/admin/chargebacks
/admin/payouts
```

## **54\. Mobile-First Design Requirements**

Prioritize: large buttons, minimal typing, Discord login, sticky registration CTA, sticky sponsor-entry CTA, clear payment status, clear payer labels, clear payout-entitlement labels, clear platform labels, clear starter and substitute labels, expandable roster sections, expandable entry-payment sections, registration progress, saved drafts, resume registration, fast bracket loading, swipe-friendly bracket navigation, narrow-screen match cards, accessible contrast, easy Discord return.

Suggested registration progress: 1\. Login, 2\. Platform, 3\. Team, 4\. Roster, 5\. Entry Funding, 6\. Rules, 7\. Check-In, 8\. Complete.

Suggested sponsor-payment progress: 1\. Select Entries, 2\. Review Ownership, 3\. Pay, 4\. Confirmation.

Before payment, clearly show: "By paying this entry, you become the payout-entitlement holder for the prize share connected to this entry."

## **55\. Required Business Rules**

Treat these as mandatory:

1. PC may only compete against PC.  
2. PS5 and Xbox may cross-play in the console division.  
3. PC and console teams never share a bracket.  
4. Only starting-player positions require entry fees.  
5. Substitutes, reserves, coaches, and managers do not owe an entry fee for their roster role.  
6. Any authorized user may pay one or more starting-player entries.  
7. A player may pay their own entry and other players' entries.  
8. A substitute, reserve, coach, manager, or supporter may sponsor starting-player entries.  
9. The payer of an entry owns the payout entitlement attached to that entry.  
10. A sponsored player does not automatically own the prize share for an entry paid by someone else.  
11. A payer who funds multiple winning entries receives the combined prize shares for all those entries.  
12. Each required starter position must have its own entry-slot record.  
13. Teams may use one payer or multiple payers.  
14. Registration is fully funded only when all required starter entry slots are paid.  
15. A substitute may replace a starter without another entry fee when the slot is already funded.  
16. A substitution does not automatically transfer payout entitlement.  
17. Refunds go to the original entry payer.  
18. Chargebacks affect only the entries connected to the disputed payment.  
19. Payment must be confirmed by a verified Stripe webhook.  
20. Supabase is the official source of truth.  
21. A disputed match cannot advance.  
22. A completed match may advance only once.  
23. A winner automatically moves to the configured next-match slot.  
24. A loser is eliminated in single elimination.  
25. The final winner becomes champion.  
26. The final loser becomes runner-up.  
27. Winning team prizes are divided into entry shares.  
28. Entry shares are allocated to payout-entitlement holders.  
29. Prize payouts require administrator approval.  
30. Google Sheets is reporting only.  
31. Discord is communication and identity only.  
32. Tournament stacking must not mix divisions, payments, entitlements, matches, or payouts.  
33. Sensitive actions must be audited.  
34. The system must prevent double payment of an entry.  
35. The system must prevent duplicate payouts.  
36. The system must show payers what payout rights they are receiving before checkout.  
37. A payer may not fund entries on two teams entered in the same tournament unless `allow_payer_to_sponsor_opposing_teams` is explicitly enabled for that tournament (Section 41).

## **56\. Build Strategy**

**Phase 1 — Foundation:** Next.js project, Supabase project, database schema, Discord OAuth, user profiles, team creation, platform rules, mobile navigation, admin authentication.

**Phase 2 — Rosters and Entry Slots:** team rosters, starter/substitute/reserve/coach/manager roles, required starter slots, registration entry slots, entry payer model, payout-entitlement model, platform validation, roster validation.

**Phase 3 — Payments and Sponsorship:** selectable unpaid entry slots, multiple-entry checkout, split team payments, checkout locks, Stripe Checkout, Stripe webhooks, payment allocation, team funding status, sponsor dashboard, payment receipts, refund records, chargeback handling.

**Phase 4 — Tournament Registration:** tournament pages, registration flow, entry-funding page, rules acceptance, check-in, registration approval, confirmation pages.

**Phase 5 — Bracket Engine:** single-elimination brackets, seeding, byes, match creation, match readiness, score validation, automatic advancement, duplicate protection, tournament completion.

**Phase 6 — Results and Disputes:** result submission, opponent confirmation, evidence upload, dispute workflow, admin resolution, forfeits, no-shows, statistics.

**Phase 7 — Prize Allocation and Payouts:** placement-prize configuration, equal entry-share calculation, payout grouping by entitlement holder, payout line items, payout review, payout approval, payout status, payout receipts, rounding handling, duplicate-payout prevention.

**Phase 8 — Discord and Automation:** Discord bot, roles, payment notifications, match notifications, n8n workflows, Google Sheets synchronization, email notifications, check-in reminders, payout alerts.

**Phase 9 — Tournament Stacking:** simultaneous tournaments, conflict detection, concurrent scheduling, qualifier brackets, championship feeds, seasons, ranking points.

## **57\. Initial Hermes Deliverables**

Before implementing the entire system, return:

1. Recommended system architecture  
2. Database entity relationship model  
3. Proposed Supabase SQL schema  
4. Registration-entry-slot model  
5. Payment-allocation model  
6. Payout-entitlement model  
7. Prize-allocation model  
8. Row Level Security plan  
9. Folder structure  
10. Environment variables  
11. Authentication flow  
12. Stripe payment flow  
13. Stripe webhook flow  
14. Refund and chargeback flow  
15. Bracket data model  
16. Match-advancement service  
17. Payout-calculation service  
18. Discord integration architecture  
19. n8n workflow map  
20. Mobile wireframe outline  
21. Admin dashboard outline  
22. Sponsor dashboard outline  
23. Risks or contradictions  
24. Configurable decisions  
25. First implementation milestone

Do not build the entire application in one uncontrolled pass. Build incrementally and keep the code modular.

## **58\. Coding Standards**

Use: TypeScript strict mode, reusable components, server-side validation, clear service layers, database transactions, typed Supabase queries, centralized status enums, centralized platform rules, centralized tournament rules, centralized payment rules, centralized payout-entitlement rules, integer cents for all money, error boundaries, loading states, empty states, audit logging, unit tests, integration tests.

Required tests: PC-versus-console compatibility, PS5-versus-Xbox compatibility, starter-entry creation, substitute no-fee registration, one payer funding one entry, one payer funding several entries, multiple payers funding one team, checkout lock expiration, duplicate-entry-payment prevention, Stripe webhook idempotency, payout-entitlement assignment, starter substitution without entitlement transfer, refund to original payer, chargeback entry reversal, prize-share calculation, multi-entry payer payout calculation, duplicate-payout prevention, bracket generation, bye advancement, score validation, match finalization, automatic advancement, dispute advancement pause, tournament completion.

Avoid: hard-coded tournament IDs, hard-coded bracket sizes, hard-coded entry counts, hard-coded prize amounts, hard-coded platform rules inside UI components, client-only payment validation, client-only payout calculations, client-controlled entitlement ownership, client-only bracket advancement, Google Sheets as the primary database, n8n as the sole payment verifier, duplicate business logic.

## **59\. First Task**

Begin by reviewing this complete specification. Return:

1. Recommended architecture  
2. Proposed database schema  
3. Entry-slot and payer relationship diagram  
4. Payout-entitlement relationship diagram  
5. Prize-calculation logic  
6. Proposed folder structure  
7. Required environment variables  
8. Build phases  
9. Risks or contradictions  
10. Configurable business decisions  
11. First implementation milestone

Then begin Phase 1 with: Supabase schema, Discord OAuth, user profiles, teams, team members, platform validation, roster roles, registration entry slots, payer records, payout-entitlement records, mobile-first application shell.

Keep every implementation aligned with the mandatory rules in this document.


---

## **60. Addendum (2026-08-05): Frontend Experience Direction**

This section amends and extends the original brief above. Where it conflicts with earlier
sections, this addendum wins for frontend/UX decisions; the data model, payments, and
bracket logic in Sections 1-59 remain unchanged.

### **Marketing/Home Experience**

The public-facing homepage is a single long **scrolling one-page experience** (not a
traditional multi-click marketing site). Structure:

1. Hero — full-viewport, Three.js particle field background, wordmark + tagline, primary
   CTAs.
2. How it works — scroll-triggered reveal of the registration to funding to bracket to payout
   flow.
3. Live tournaments teaser — pulls from `/tournaments` data once available.
4. Trust/stats band — entries funded, prize paid out, active players (populated from
   Supabase once live; static placeholders until then).
5. Discord community CTA.
6. Footer.

Deep functionality (registration, team management, dashboards, bracket viewing, checkout)
remains on **dedicated routes**, not embedded inline in the scroll. CTAs on the one-page
homepage redirect to `/login`, `/tournaments`, `/tournaments/[slug]/register`, etc. per
Section 53's core page list. "One-page" describes the marketing/home layer only.

### **Visual Direction**

Reference inspiration: chaostournaments.com (existing minimal build, see note below) and
digitalbutlers.team (oversized bold display type, high-contrast accent color against a dark
or saturated background, floating 3D-rendered objects overlapping text, pill-shaped CTAs,
card-based sections with subtle scroll reveals).

Applied to Chaos Tournaments:

* Base palette: black (#0A0A0A) background, gold (#FACC15) accent, per the brand kit.
* Oversized display headlines, generous whitespace, high contrast.
* A Three.js particle field in the hero: ambient animated points (not decorative-only,
  should react subtly to scroll/pointer where performance allows).
* Scroll-triggered animation (GSAP ScrollTrigger or Framer Motion useScroll) driving
  section reveals, staggered card entrances, and parallax on the hero particle field.
* Mobile-first is non-negotiable: the 3D/particle layer must degrade gracefully (reduced
  particle count or static gradient fallback) on low-power mobile devices and respect
  prefers-reduced-motion.

### **Note: existing chaostournaments.com**

A live site already exists at chaostournaments.com with the Chaos Tournaments name, R6
Siege framing, Discord login, and /tournaments, /teams, /grudge-matches routes. Before the
VPS deploy step (Section 62), confirm whether this new build replaces that deployment or
whether the live site is a separate/earlier instance to be retired manually. Do not assume
the VPS target is empty.

### **Frontend Stack Additions**

In addition to Section 1's frontend stack, use:

* Three.js (three) for the particle field / 3D hero element.
* GSAP + ScrollTrigger (or Framer Motion) for scroll-triggered animation.
* Both must be client-only (dynamically imported, ssr: false) to keep server-rendered
  pages fast and avoid hydration mismatches.

## **61. Addendum: Extended Integrations**

Two additional tools join the automation/content stack described in Section 3 ("Other
Integrations" and Automation), in support of the "hands-off for owner" goal in the original
project brief.

### **Firecrawl (web data / crawling)**

Open-source (AGPL-3.0) web-data API that turns pages into LLM-ready markdown/structured
JSON; self-hostable via Docker Compose (API + Redis + RabbitMQ + Postgres +
Playwright-service), or usable via the hosted API.

Planned uses:

* Feed n8n workflows with fresh external data (game patch notes, ranked leaderboard
  snapshots, opposing-org roster pages) to auto-enrich tournament pages or Discord posts
  without manual data entry.
* Opponent/team research for grudge-match matchmaking pages.
* Periodic crawl of the platform's own public pages for QA/SEO snapshotting.

Config: FIRECRAWL_API_KEY (hosted) or FIRECRAWL_API_URL (self-hosted instance). See
.env.example and lib/firecrawl.ts.

### **Higgsfield (AI video/image generation)**

AI-native generative video platform: text/image prompts to short cinematic clips with
camera controls, plus image generation. Founded 2025.

Planned uses:

* Auto-generate tournament announcement / hype clips and highlight recaps triggered by n8n
  (on tournament completion: pull the final bracket and winner, generate a short recap
  clip, post to Discord/social).
* Generate on-brand OG/social thumbnail art variations for individual tournaments beyond
  the static brand-kit assets.
* Not required for Phase 1-2; slots into Phase 8 (Discord and Automation).

Config: HIGGSFIELD_API_KEY. See .env.example and lib/higgsfield.ts.

Both integrations are content/automation tooling, not part of the payment, bracket, or
entitlement source-of-truth systems. Supabase remains authoritative per Section 20 of the
original rules.

## **62. Addendum: VPS Deployment Notes**

See DEPLOY.md and deploy/ for the concrete deployment procedure (Docker + Nginx +
Certbot). Before the first production deploy, resolve the Section 60 note about the
existing chaostournaments.com deployment.

**Superseded 2026-08-07:** the actual production deploy did not use nginx/Certbot — the
target VPS already ran a working Docker Compose + Caddy 2 stack (Caddy handles the
reverse proxy and TLS automatically), which was reused as-is rather than replaced.
DEPLOY.md and deploy/deploy.sh still describe the original nginx plan and are stale; the
real process (SSH key setup, backup, rsync-based code sync excluding the server's
docker-compose.yml/Caddyfile/.env, then `docker compose up -d --build`) is documented in
[docs/wiki/deployment.md](./wiki/deployment.md).

## **63. Addendum: Phase 2 — Teams, Rosters, Tournament Registration, Admin, and Discord Automation**

Implemented and verified live at chaostournaments.com on 2026-08-07, building on the
Phase 1 foundation (Section 56).

### Team and tournament registration (Sections 18, 19, 22, 24 — scoped subset)

Live: create a team (`/teams/new`, captain = creator), captain-only roster management
(`/teams/[slug]` — add/remove members with `roster_role` and `platform`), browse
tournaments (`/tournaments`), and register a team for one (`/tournaments/[slug]`).

Schema: `supabase/schema_phase2.sql` (additive to `schema.sql`) adds `tournaments` and
`tournament_registrations`, using the field names and `registration_status` enum from
Sections 22 and 24 where practical, but as a **deliberately reduced scope**:

* No per-entry-slot payment/sponsorship model (Sections 7-9, 52) — that's Stripe-backed
  Phase 3. A team registration currently lands in `awaiting_roster` or `pending_review`
  (roster-complete-but-unfunded) rather than progressing through the funded states.
* No `tournament_settings` table (Section 24) — configurable business rules (operations
  fee %, prize rounding, etc.) aren't needed until payments exist.
* No bracket-related fields (`bracket_size`, `best_of`, `third_place_match`, round/check-in
  timing fields) — deferred to the bracket-engine phase (Sections 25-27).

RLS: captains can insert/update/delete their own team's rows (`team_members`,
`tournament_registrations`); everyone can read. No admin RLS policies yet — the admin
tournament-creation path (below) uses the service-role client instead.

### Admin: tournament creation

Minimal admin surface: `/admin/tournaments/new`, gated by `user_profiles.is_admin`
(`supabase/schema_admin.sql` — a simple boolean, no roles/permissions table, admins set
via manual SQL `update`). The server action checks `is_admin` in application code, then
inserts via `createAdminClient()` (service-role, bypasses RLS). This is the *only* way to
create a tournament right now — there is no admin dashboard (Section 50-51 scope) yet.

### Discord automation (Section 3, Section 61 — "hands-off for owner")

Implemented as **webhook notifications**, not a persistent bot: `src/lib/discord.ts`
posts to a configured Discord webhook URL (`DISCORD_WEBHOOK_URL`) on team creation,
tournament creation, and tournament registration. No bot token, no new hosting, no
Docker service — just an HTTP POST from the existing Next.js server actions.

This is a scope decision, not the full picture: a real bot (slash commands, check-in
reminders that read tournament state and respond, per-user DMs, reacting to messages)
needs a Discord bot application, a persistent process (e.g. discord.js) running as its
own service, and a bot token with appropriate gateway intents — meaningfully more
infrastructure than a webhook. Worth building once there's enough tournament/match state
(post-bracket-engine, Sections 25+) to justify interactive bot features. Tracked in
[docs/wiki/open-questions.md](./wiki/open-questions.md).

### Known gotcha: Discord username vs. display name

Discord's newer unique-username system means `raw_user_meta_data ->> 'user_name'` (which
populates `user_profiles.discord_username` via the `handle_new_user()` trigger, Section
4) can be `null` for accounts that haven't set a legacy-style username — only
`discord_display_name` is reliably populated. Any user lookup by "Discord username"
(e.g. the roster-add flow) needs to check both fields, case-insensitively.

## **64. Addendum: Admin Dashboard (Tournament Management + Registration Review)**

Implemented and verified live at chaostournaments.com on 2026-08-07, extending the
Section 63 admin surface from "create only" to "manage."

* `/admin` — hub listing every tournament (including drafts, which don't appear on the
  public `/tournaments` page), with a pending-registration count and a link into each
  tournament's edit page.
* `/admin/tournaments/[slug]/edit` — edit description, required starters, entry fee,
  prizes, start date, and status (`draft → open → closed → in_progress →
  completed/cancelled`, the Section 24 status set minus the bracket-active substates,
  which aren't reachable without a bracket engine yet). Also lists that tournament's
  registrations with Approve/Reject actions, gated to rows currently in
  `pending_review`.
* Same admin pattern as Section 63: `is_admin` check in application code, mutation via
  `createAdminClient()` (service-role, bypasses RLS) rather than an admin RLS policy.
* "Reject" stores `withdrawn` rather than a dedicated rejected status — Section 22's
  enum has no separate admin-rejection state, and `withdrawn` is the practical
  equivalent (team is not competing).
* Discord webhook notifications extended to cover tournament status changing to `open`
  and registration approve/reject, alongside the Section 63 events.

### Known bug and fix: stale form after save

`EditTournamentForm`'s `<select>`/inputs use uncontrolled `defaultValue`. After a
successful save, the server action calls `revalidatePath`, which refreshes the parent
server component's data — but React does not re-apply `defaultValue` to an
already-mounted uncontrolled element just because the prop changed, so a saved status
change appeared not to have taken effect (it had; only the display was stale). Fixed by
keying the form component on `tournament.updated_at`, forcing a remount on every
successful save. Worth remembering for any future admin/edit forms built the same way.

## **65. Addendum: Single-Elimination Bracket Engine**

Implemented and verified live at chaostournaments.com on 2026-08-07, closing the biggest
gap left after Section 64: approved teams previously had nowhere to go. Scoped subset of
Sections 24-27, 29, 32 — best-of series, two-party result confirmation, disputes, and
payout creation are explicitly deferred.

Schema: `supabase/schema_bracket.sql` (additive) adds a single `matches` table —
`tournament_id`, `round_number`/`round_name`, `match_number`, `team_1_id`/`team_2_id`,
`next_match_id`/`next_match_slot` (links a match to where its winner advances),
`winner_team_id`/`loser_team_id`, `status` (`pending`/`ready`/`completed`), and
`result_type` (`normal`/`bye`/`admin_decision`). RLS is select-only for everyone; all
writes go through the service-role client from admin-gated server actions, same pattern
as Sections 63-64.

### Bracket generation (`src/lib/bracket.ts`, `generateBracket` in `src/lib/actions/bracket.ts`)

`buildBracket()` is a pure function seeding teams in registration order using standard
power-of-two bracket placement (recursive mirroring, so top seeds are maximally
separated), assigning byes to the top seeds when the field isn't a power of two, and
resolving byes by cascading them forward through a stabilizing loop until no
newly-created match has two already-decided sides. Verified twice: first via a
standalone Node.js script against 3-, 5-, and 8-team cases before wiring into
production, then again live against a real 5-team test tournament — the deployed
output matched the predicted bracket shape exactly (Team 1 and Team 2 byes into
Semifinals, Team 4 vs. Team 5 in the only live Quarterfinal, Team 2 vs. Team 3 already
fully populated in the Semifinals from cascading byes).

`generateBracket` is admin-only, requires no existing matches for the tournament, seeds
from `approved` registrations ordered by `created_at`, bulk-inserts the full match tree
in one write (match IDs are pre-generated client-side via `crypto.randomUUID()` so
`next_match_id` links can be set without a second pass), flips those registrations to
`active` and the tournament to `in_progress`, and fires a Discord notification.

### Result reporting and advancement (`reportMatchResult` in `src/lib/actions/bracket.ts`)

Admin-only, validates the match is `ready` and the winner is actually one of its two
teams, marks it `completed` with `result_type: admin_decision`, sets the loser's
registration to `eliminated`, and either:

* propagates the winner into `next_match_id`'s `next_match_slot`, marking that match
  `ready` once both slots are filled, and notifies Discord — or, if there is no
  `next_match_id` (this was the championship match),
* sets the winner's registration to `winner`, the loser's to `runner_up`, the
  tournament's status to `completed`, and fires a celebratory Discord notification.

Verified live end-to-end on the same 5-team test tournament: generated the bracket,
reported both Quarterfinal/Semifinal results, confirmed correct winner propagation into
each next match (including the cascaded-bye Semifinal), reported the Championship, and
confirmed the tournament reached `completed` with `winner`/`runner_up` registration
statuses set correctly. Test data (tournament, 5 teams, registrations, matches) has
been deleted from production.

### UI

`/tournaments/[slug]/bracket` — public bracket view, columns per round, admin-only
"Generate bracket" button (shown once ≥2 registrations are `approved`) and "Report
winner" buttons on `ready` matches. `/admin/tournaments/[slug]/edit` links to it once a
bracket exists. `/tournaments/[slug]` links to it via "View bracket →".

### Known limitation

Reporting relies entirely on admin judgment (`result_type: admin_decision`) — there's no
in-app score submission or two-sided confirmation from the teams themselves (Section 29).
Fine for a hands-on admin running a small bracket; worth revisiting if event volume grows
enough that manual result entry becomes the bottleneck.

## **66. Addendum: Stripe Entry Fees + Prize Payouts (Phase 3)**

Schema: `supabase/schema_payments.sql` (additive — `platform_settings`, Connect fields on
`user_profiles`, `registration_payments`, `tournament_payouts`). Not yet applied to
production Supabase; run it in the SQL Editor before this code goes live.

### Model

A single flat entry fee (admin-editable, starts at $5, `platform_settings.entry_fee_cents`)
is charged once per team registration — this supersedes the per-tournament
`entry_fee_per_starting_slot` field from Section 22/Phase 2 for charging purposes; that
column is left in the schema unused rather than removed. `registered_by` on
`tournament_registrations` is who registers the team; the payer recorded on
`registration_payments` (normally the same person, via Stripe Checkout right after
registering) is who receives any prize payout if that team places.

When a tournament's championship match completes (`reportMatchResult` in
`src/lib/actions/bracket.ts`), the platform takes `platform_fee_percent` (default 20%) off
the sum of every `paid` entry fee collected for that tournament. The remainder splits
`winner_share_percent` (default 70%) to whoever paid for the winning team's entry, the rest
to whoever paid for the runner-up's. No-ops entirely if nothing was collected (free
tournament).

Payout recipients must complete Stripe Connect Express onboarding (bank account link)
before funds move. The transfer fires automatically the moment onboarding completes — no
admin action required, matching the project's "hands-off for owner" goal. This is
webhook-driven (`account.updated` → `processReadyPayoutsForUser` in
`src/lib/actions/payouts.ts`), with a defensive immediate-transfer attempt right after a
payout row is created in case the recipient was already onboarded from a previous win.

### Registration flow change

`registerTeamForTournament` (`src/lib/actions/tournaments.ts`): once the roster is full,
checks the current entry fee. $0 → straight to `pending_review` as before. Otherwise →
`awaiting_entry_funding`, and the captain is redirected (`redirect()` inside the server
action) to a Stripe Checkout Session for the fee amount
(`src/lib/actions/payments.ts::createEntryFeeCheckoutSession`), which also writes a
`pending` `registration_payments` row. On successful payment, the webhook
(`src/app/api/stripe/webhook/route.ts`, `checkout.session.completed`) marks that row
`paid` and flips the registration to `pending_review`.

### Webhook

`src/app/api/stripe/webhook/route.ts` — subscribe it in the Stripe Dashboard to
`checkout.session.completed` and `account.updated`, pointed at
`https://chaostournaments.com/api/stripe/webhook`. Verifies the raw request body against
`STRIPE_WEBHOOK_SECRET` before trusting any event. Idempotent on `checkout.session.completed`
(checks `status !== "paid"` before reprocessing, since Stripe can redeliver events).

### Admin control

`/admin/settings` (`src/app/admin/settings/page.tsx`, `src/components/PlatformSettingsForm.tsx`,
`src/lib/actions/settings.ts`) — admin-only page to edit the entry fee dollar amount,
platform cut %, and winner/runner-up split %, without a redeploy. Linked from `/admin`.

### Dashboard payout claim UI

`/dashboard` shows a "Prize payout waiting on you" card for any `tournament_payouts` row
still `awaiting_onboarding`/`ready` for the signed-in user, with a "Set up payout" button
(`src/components/ClaimPayoutButton.tsx`) that calls `startConnectOnboarding` and redirects
into Stripe's hosted Express onboarding flow.

### Env vars

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (already
reserved in `.env.example`). Test-mode keys are wired in for local development; production
needs live-mode keys plus a live-mode webhook endpoint configured in the Stripe Dashboard
(test and live webhooks are separate).

### Known limitations / not built

* No refund flow — if an admin rejects a `pending_review` registration whose fee was
  already paid, the fee currently isn't automatically refunded (Section 22's `refunded`/
  `refund_pending` states exist in the enum but nothing writes to them yet).
* No 3rd-place payout, even though `tournaments.third_place_prize` exists as a column —
  the bracket engine only tracks winner/runner-up, so there's no 3rd-place registration
  status to hang a payout off of.
* Stripe Connect Express accounts are created as `business_type: "individual"` with only
  the `transfers` capability requested — fine for individual payers, would need revisiting
  for a payer registering as a business entity.
* Verified end-to-end in test mode on production: registered a test team for a $5-entry
  tournament, paid with Stripe's test card, confirmed the webhook flipped the registration
  to `pending_review`. Not yet tested against live Stripe (test-mode keys only) — see
  `docs/wiki/open-questions.md` for the checklist before going live with real payments.
  One deploy gotcha hit along the way: the webhook was initially created in a different
  Stripe sandbox than the one whose keys were on the VPS ("Chaos Tournaments sandbox" vs.
  the original test keys) — zero webhook deliveries with no error was the symptom. Fixed by
  matching the server's keys to the sandbox the webhook lives in. Worth double-checking key/
  webhook sandbox alignment before assuming a "no deliveries" webhook is a code bug.

## **67. Addendum: Discord Bot (Phase 8, scoped subset)**

Standalone Node/TypeScript project at `bot/` (not part of the Next.js app), running
discord.js as its own Docker service alongside `web` and `caddy`. Deliberately scoped to
commands and role automation that map to features that actually exist today — Section 49's
full command list (`/checkin`, `/entries`, `/sponsor-entry`, `/report-score`,
`/confirm-score`, `/dispute`, `/accept-grudge`, `/decline-grudge`, etc.) assumes several
features not yet built: a formal check-in flow, per-slot entry funding, two-party match
confirmation, and the Grudge Matches feature (currently a placeholder page with no backend).
Building those commands now would just be empty shells with nothing to call — revisit this
bot once those features exist.

### What's built

* **Slash commands** (guild-scoped, registered via `bot/src/registerCommands.ts` — re-run
  after any command changes, propagates instantly since it's guild-scoped rather than
  global): `/roster <team>`, `/bracket <tournament>`, `/match-status` (ephemeral),
  `/rules`, `/payment-status` (ephemeral — Section 51 says payers may only view their own
  financial records).
* **Role automation**: `bot/src/roles.ts` finds-or-creates five roles by name (Team
  Captain, Starter, Registered, Tournament Winner, Tournament Runner-Up — the subset of
  Section 49's role list that maps to real state; "Fully Funded" and "Checked In" aren't
  wired up since those states don't exist). Triggered by the Next.js app calling the bot's
  internal HTTP API (`bot/src/internalApi.ts`, `POST /internal/role-sync`, shared-secret
  auth, never exposed outside the Docker network) right after: team creation → Team
  Captain; adding a starter to a roster → Starter; a registration being approved → Registered
  (applied to the captain and all active roster members); a tournament completing →
  Tournament Winner / Tournament Runner-Up. Wiring lives in `src/lib/bot.ts`
  (`notifyBotRoleSync`), called from `src/lib/actions/teams.ts`, `admin.ts`, and
  `bracket.ts` — same "hands-off for owner," fire-and-forget pattern as `notifyDiscord()`,
  and no-ops quietly if the bot isn't configured.
* **Check-in reminders** (`bot/src/reminders.ts`): polls every 5 minutes (configurable) for
  tournaments starting within the next 30 minutes (configurable) with `approved`/`active`
  registrations, DMs each team's captain once, and sets a new `reminder_sent_at` timestamp
  on `tournament_registrations` to avoid duplicate DMs. This is a reminder only, not a gate
  on anything — there's no formal check-in step to complete afterward yet.

### Deploy requirements

New Discord bot application (or reuse the existing "Chaos Tournaments" OAuth app's Bot tab
in the Developer Portal — one application can have both an OAuth2 login flow and a bot
user). Needs: a bot token, the server's Guild ID, the `applications.commands` and `bot`
OAuth2 scopes with `Send Messages`/`Manage Roles` permissions when generating the invite
link, and the bot's role in the server's role list positioned above the roles it manages
(Discord permission model — a bot can't grant/manage a role positioned above its own
highest role). Env vars: `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `BOT_INTERNAL_SECRET`
(new — reserved in `.env.example`). `BOT_INTERNAL_URL` is set automatically by
`docker-compose.yml` for the `web` service (`http://bot:4001`), not something to configure
manually. Schema: `supabase/schema_discord_bot.sql` (adds `reminder_sent_at` to
`tournament_registrations` — additive, no data migration needed).

### Known limitations / not built

* No formal check-in flow — reminders are informational only.
* No two-party match result confirmation, disputes, or grudge matches — commands for these
  intentionally omitted (see above).
* Role removal isn't wired into every state transition (e.g. a `Registered` role isn't
  stripped if a registration is later withdrawn) — roles only ever get added in this first
  pass, not cleaned up on the reverse transition.
* Command registration is a manual one-off script (`npm run register-commands` inside the
  container), not run automatically on every deploy — only needs re-running when commands
  change, but easy to forget after adding a new one.
