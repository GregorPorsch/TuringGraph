# Turing Machine YAML Format

Define multi-tape Turing machines in YAML for visualization and execution. This README explains **only the YAML format**—what to write and how—so you can author machines quickly and correctly.

---

## Top-Level Keys

- **`tapes`**  
  Integer between **1** and **6**.

- **`input`**  
  Initial content of each tape.
    - Use **`/`** to separate tapes: e.g. `"1011/01"` means tape1=`1011`, tape2=`01`.
    - Use an **empty segment** for a blank tape: e.g. `"abc//def"` → tape2 starts blank.
    - For a single tape, no slashes.

- **`blank`**  
  Single character used to represent blank cells (commonly a space `" "`).

- **`startstate`**  
  Name of the initial state (single word; avoid spaces or characters like `/ [ ] ,`).

- **`table`**  
  Mapping from **state name** → **transitions**. A state with no outgoing transitions uses `{}` (e.g., `accept: {}`).

---

## Transitions: Conditions → Actions

Inside each state, you write **transitions** as:

```
<condition>: <action>
```

### 1) Condition Syntax

A condition describes the symbols *currently under the heads*.

- **One tape**
    - Single symbol: `"0"`, `"1"`, or `" "` (blank).
    - **`all`** matches any symbol.
    - Group multiple options with brackets: `"[0, 1]"`.

- **Multiple tapes**
    - Separate per-tape symbols with `/`: e.g. `"0/1"` (tape1=`0`, tape2=`1`).
    - Use `" "` for blank on a tape: e.g. `"1/ "` (tape2 blank).
    - **`all`** applies per tape: e.g. `"all/0"`.
    - Group multiple combinations with brackets: `"[0/0, 1/1]"`.

**Examples**
```yaml
# 1 tape
"0": ...
"[0, 1]": ...
" ": ...

# 2 tapes
"1/0": ...
"all/ ": ...
"[0/0, 1/1]": ...

# 3 tapes
"1/ /0": ...
```

> Tip: Quote keys that contain spaces or special characters.

### 2) Action Types

An action tells the machine **what to write**, **how to move**, and optionally **which state to go to**.

You can write an action as:

#### A. Movement string (stay in the same state)
- **1 tape:** `"L"`, `"R"`, or `"S"`
- **k tapes:** e.g. `"L/R/S"` (one letter per tape, separated by `/`)

```yaml
"0": "R"          # move Right, remain in current state
"1/0": "L/S"      # move Left on tape1, Stay on tape2, remain in current state
```

#### B. Object with optional `write` and one movement key → next state
- **`write`** (optional): symbol(s) to write **before** moving
    - 1 tape: `"0"`, `"1"`, `"same"`
    - k tapes: `"0/1/.../same"` (one per tape; use `"same"` to keep a symbol)
- **Movement key**:
    - 1 tape: `L`, `R`, or `S`
    - k tapes: e.g. `L/R/S`  
      The movement key maps to the **next state**.

```yaml
"1": { R: next }                    # keep symbol, move Right, go to 'next'
"2": { write: "0", L: next }        # write 0, move Left, go to 'next'

"0/1": { write: "same/same", R/L: step2 }  # keep both, move R on tape1, L on tape2
" /0": { write: "1/same", S/R: carry }     # write 1 on tape1, keep tape2, move S/R, go 'carry'
```

#### C. List of actions (nondeterministic)
Provide several possible actions; the machine may choose any.

```yaml
"0":
  - { write: "0", R: next }
  - { write: "1", R: next }
"1": [{write: "1", R: next}, {write: "0", R: next}] # also valid
```

---

## Conventions & Tips

- **Quote** condition keys and any value containing spaces or special characters.
- Use **`/`** to separate per-tape symbols and per-tape movements.
- Use **`" "`** (a space) wherever the blank symbol is referenced in conditions.
- Final/halting states are simply **empty mappings**: `accept: {}`.
- Movement-only strings keep you in the **current** state; use an object with a movement key to jump to a **specific** next state.
- `write` strings for multi-tape actions must have **one segment per tape** (use `"same"` to leave a tape unchanged).

---

## Minimal Template

```yaml
tapes: 1
input: ""
blank: " "
startstate: start
table:
  start:
    " ": { S: accept }
  accept: {}
```

---

That’s it—you can now author single- or multi-tape Turing machines in YAML using this format. Happy building!