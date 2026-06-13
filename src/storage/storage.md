# src/storage/storage.ts

## What is this file?
Handles all reading and writing of lists to the user's phone storage.
Uses AsyncStorage — like a key-value database that lives on the device.
No internet. No backend. Everything stays on the user's phone.

---

## How data is stored
Key: 'forgot_something_lists'
Value: all lists as a JSON string

---

## Functions

### loadLists()
Reads all lists from phone storage.
Returns empty array if nothing saved yet or if read fails.

### saveLists(lists)
Writes all lists to phone storage.
Replaces everything — always saves the full list array.
Throws error if save fails — caller decides what to do.

### addList(list, current)
Adds a new list to the top.
Takes current lists from caller — no extra storage read needed.
Returns the new lists array.

### updateList(updated, current)
Finds the list by ID and replaces it.
Takes current lists from caller — no extra storage read needed.
Returns the new lists array.

### deleteList(id, current)
Removes a list by ID.
Takes current lists from caller — no extra storage read needed.
Returns the new lists array.

---

## Key principle
All mutating functions (add, update, delete) take `current` from
the caller because screens already have lists in state.
No unnecessary re-reads from storage.