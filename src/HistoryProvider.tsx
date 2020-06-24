import { createBrowserHistory, History, State, Update } from 'history';
import {
  Component,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';

export interface HistoryContextValue<S extends State = State>
  extends History<S> {
  getState: () => Update;
  getAction: () => Update['action'];
  getLocation: () => Update['location'];
}

export const HistoryContext = createContext<HistoryContextValue>();
export const useHistory = () => useContext(HistoryContext);

export interface HistoryProviderProps<S extends State = State> {
  history?: History<S>;
}

export const HistoryProvider: Component<HistoryProviderProps> = (props) => {
  const history = props.history ?? createBrowserHistory();

  const [getState, setState] = createSignal<Update>({
    action: history.action,
    location: history.location,
  });

  const cleanupHandler = history.listen(setState);
  onCleanup(() => cleanupHandler());

  const value: HistoryContextValue = {
    ...history,
    get action() {
      return getState().action;
    },
    get location() {
      return getState().location;
    },
    getState,
    getAction: () => getState().action,
    getLocation: () => getState().location,
  };

  return (
    <HistoryContext.Provider value={value}>
      {props.children}
    </HistoryContext.Provider>
  );
};
