from state.local_store import LocalStateStore


state_store = LocalStateStore()


def get_state_store():
    return state_store