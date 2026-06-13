# src/hooks/useLists.ts

## What is a hook?
A hook is a reusable function that holds logic and state.
Instead of writing the same code in every screen, 
we write it once in a hook and every screen just calls it.

## Why did we create this?
Before this hook, HomeScreen and ListDetailScreen were both doing:
- load lists from storage
- save lists to storage  
- update state manually
Same code, two places. That's the problem.

## What does this hook do?
It manages everything related to lists in one place:
- holds the lists in state
- loads from phone storage
- adds, updates, deletes lists
- tracks if data is still loading

## What screens get from this hook:
lists        → the current array of lists
isLoading    → true while reading from storage (show spinner)
refreshLists → reload lists from storage (call on screen focus)
createList   → add a new list
editList     → update an existing list
removeList   → delete a list by id

## How a screen uses it:
Instead of this (old way):
  const [lists, setLists] = useState([])
  loadLists().then(setLists)
  const updated = [newList, ...lists]
  await saveLists(updated)
  setLists(updated)

Just this (new way):
  const { lists, refreshLists, createList } = useLists()
  refreshLists()
  createList(newList)

## Key idea
Screens only care about what to show and what the user did.
The hook handles all the data logic behind the scenes.