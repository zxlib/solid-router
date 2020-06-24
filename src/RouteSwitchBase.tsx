import {
  cloneProps,
  Component,
  createContext,
  createEffect,
  createMemo,
  mapArray,
  suspend,
  useContext,
} from 'solid-js';
import { ActiveRoute, ActiveRouteModel, RouteModel, RouteProps } from './Route';
import { MatchRouteFn, RouteMatch } from './utils';

export interface RouteSwitchProps {
  id?: string; // for testing, etc
  fallback?: JSX.Element;
  routes?: RouteModel[];
  onRoute?: (route: ActiveRoute, parent?: ActiveRoute) => any;
  // children?: Route[]; // TODO: type it ot allow only routes
}

export interface RouteSwitchBaseProps extends RouteSwitchProps {
  matchRoute: MatchRouteFn;
}

export interface RouteSwitchContextValue {
  route: ActiveRoute;
  parent?: RouteSwitchContextValue;
  /** returns active route model */
  getRoute: () => ActiveRoute;
  /** returns parent RouteSwitch context */
  getParent: () => RouteSwitchContextValue | undefined;
}

export const RouteSwitchContext = createContext<RouteSwitchContextValue>();
export const useRouteSwitch = () => useContext(RouteSwitchContext);

type MatchResult = { idx: number; route?: RouteModel; match: RouteMatch };

const createRouteModel = (
  props: RouteProps,
  parent?: ActiveRoute,
): RouteModel => {
  let prefix = '';
  const route = cloneProps(props) as RouteModel;

  if (parent) {
    route.parent = parent;
    if (!route.full) {
      prefix = parent.patternPrefix;
    }
  }

  if (route.path) {
    route.pattern = prefix + route.path;
    if (route.prefix) {
      route.pattern += ':__suffix(/.*|$)';
    }
  }
  return route;
};

const createActiveRoute = (
  { route, match }: MatchResult,
  parent?: ActiveRoute,
): ActiveRoute => {
  if (!route) {
    return false;
  }
  const res = cloneProps(route) as ActiveRouteModel;
  res.patternPrefix = '';
  res.linkPrefix = '';
  if (parent) {
    res.patternPrefix += parent.patternPrefix;
    res.linkPrefix += parent.linkPrefix;
  }
  if (route.prefix && match && match.params) {
    if (route.path) {
      res.patternPrefix += route.path;
    }
    const suffix = match.params['__suffix'];
    if (typeof suffix === 'string') {
      res.linkPrefix = match.path.substring(
        0,
        match.path.length - suffix.length,
      );
    }
  }
  return res;
};

const evalMatchResult = (routes: RouteModel[], matchRoute: MatchRouteFn) => {
  let fallbackIdx: number = -1;
  const res: MatchResult = { idx: -1, match: false };
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (route.fallback) {
      fallbackIdx = i;
    } else if ((res.match = matchRoute(route))) {
      res.idx = i;
      break;
    }
  }
  if (res.idx < 0 && fallbackIdx >= 0) {
    res.idx = fallbackIdx;
  }
  res.route = routes[res.idx];
  return res;
};

export const RouteSwitchBase: Component<RouteSwitchBaseProps> = (props) => {
  const parent = useRouteSwitch();

  // const log = (...args: any[]) =>
  //   console.log(`switch[${props.id ?? ''}] `, ...args);

  // log('create!');

  const getRoutes = createMemo(
    mapArray(
      () =>
        [
          ...(props.routes ?? []),
          ...(Array.isArray(props.children)
            ? props.children
            : [props.children]),
        ] as RouteProps[],
      (route) => createRouteModel(route, parent?.getRoute()),
    ),
  );

  const getMatchResult = createMemo(
    () => evalMatchResult(getRoutes(), props.matchRoute),
    { idx: -1, match: false },
    (a, b) => a.idx === b.idx && !a.match === !b.match,
  );

  const getRoute = createMemo(
    () => createActiveRoute(getMatchResult(), parent?.getRoute()),
    false,
  );

  createEffect(
    () =>
      typeof props.onRoute === 'function' &&
      props.onRoute(getRoute(), parent?.getRoute()),
  );

  const contextValue: RouteSwitchContextValue = {
    get route() {
      return getRoute();
    },
    get parent() {
      return parent;
    },
    getRoute,
    getParent: () => parent,
  };

  return (
    <RouteSwitchContext.Provider value={contextValue}>
      {suspend(() => {
        const { route } = getMatchResult();
        if (!route) {
          return props.fallback;
        }
        return route.component ? <route.component /> : route.children;
      })}
    </RouteSwitchContext.Provider>
  );
};
