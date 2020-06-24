import { History } from 'history';
import { Component, createContext, createSignal, useContext } from 'solid-js';
import {
  HistoryContextValue,
  HistoryProvider,
  useHistory,
} from './HistoryProvider';
import { ActiveRoute, Route, RouteProps } from './Route';
import { RouteSwitchBase, RouteSwitchProps } from './RouteSwitchBase';
import {
  IsPathActiveFn,
  matchPath as matchPathDefault,
  MatchPathFn,
  MatchRouteFn,
} from './utils';

export interface RouterContextValue extends HistoryContextValue {
  route: ActiveRoute;
  getRoute: () => ActiveRoute;
  matchPath: MatchPathFn;
  matchRoute: MatchRouteFn;
  isPathActive: IsPathActiveFn;
  Switch: Component<RouteSwitchProps>;
  Route: Component<RouteProps>;
}
export const RouterContext = createContext<RouterContextValue>();
export const useRouter = () => useContext(RouterContext);

export interface RouterProviderProps {
  matchPath?: MatchPathFn;
  matchRoute?: MatchRouteFn;
}

export const HistoryRouterProvider: Component<RouterProviderProps> = (
  props,
) => {
  const history = useHistory();
  const [getRoute, setRoute] = createSignal<ActiveRoute>(false);

  const matchPath = props.matchPath ?? matchPathDefault;
  const matchRoute: MatchRouteFn = (
    route,
    location,
    matchPath_ = matchPath,
  ) => {
    if (route && route.pattern) {
      if (!location) {
        location = history.getLocation();
      } else if (typeof location === 'string') {
        location = { ...history.getLocation(), pathname: location };
      }
      return matchPath_(route.pattern, location.pathname);
    }
    return false;
  };

  const isPathActive: IsPathActiveFn = (pathname) => {
    return pathname === history.getLocation().pathname;
  };

  const Switch: RouterContextValue['Switch'] = (props) => {
    const handleRoute: RouteSwitchProps['onRoute'] = (route, parent) => {
      setRoute(route ? route : parent ?? false);
      if (typeof props.onRoute === 'function') {
        props.onRoute(route, parent);
      }
    };

    return (
      <RouteSwitchBase
        {...props}
        matchRoute={matchRoute}
        onRoute={handleRoute}
      />
    );
  };

  const value: RouterContextValue = {
    ...history,
    get action() {
      return history.getAction();
    },
    get location() {
      return history.getLocation();
    },
    get route() {
      return getRoute();
    },
    getRoute,
    matchPath,
    isPathActive,
    matchRoute,
    Switch,
    Route,
  };

  return (
    <RouterContext.Provider value={value}>
      {props.children}
    </RouterContext.Provider>
  );
};

export const RouterWithHistoryProvider: Component<
  RouterProviderProps & { history?: History }
> = (props) => {
  return (
    <HistoryProvider history={props.history}>
      <HistoryRouterProvider {...props} />
    </HistoryProvider>
  );
};

export { RouterWithHistoryProvider as RouterProvider };
