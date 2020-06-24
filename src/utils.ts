import { Location } from 'history';
import { Match, match } from 'path-to-regexp';
import { Component } from 'solid-js';
import { RouteModel, ActiveRoute } from './Route';

export type ComponentProps<C> = C extends Component<infer P> ? P : never;

export type IsRoutesEqualFn = (
  a?: RouteModel | false,
  b?: RouteModel | false,
) => boolean;

export const isRoutesEqual: IsRoutesEqualFn = (a, b) => {
  if (!a || !b || a.pattern !== b.pattern || !a.fallback !== !b.fallback) {
    return false;
  } else if (!a.parent && !b.parent) {
    return true;
  } else {
    return isRoutesEqual(a.parent, b.parent);
  }
};

export const isSubRouteOf = (
  route: ActiveRoute,
  parent: ActiveRoute,
  allowEquals: boolean = true,
): boolean => {
  if (route && parent) {
    let r = allowEquals ? route : route.parent;
    while (r) {
      if (isRoutesEqual(r, parent)) {
        return true;
      }
      r = r.parent;
    }
  }
  return false;
};

export type RouteMatchParams = Record<string, any>;
export type PathMatch<P extends RouteMatchParams = RouteMatchParams> = Match<P>;
export type RouteMatch<
  P extends RouteMatchParams = RouteMatchParams
> = PathMatch<P>;

export type MatchPathFn = (pattern: string, path?: string) => PathMatch;
export type MatchRouteFn = (
  route?: RouteModel | false,
  location?: Location | string,
  matchPath?: MatchPathFn,
) => RouteMatch;

// export type IsLocationActiveFn = (location: Location) => RouteMatch;
export type IsPathActiveFn = (path: string) => boolean;

const _pathMatchers: Record<string, MatchPathFn> = {};
export const matchPath: MatchPathFn = (pattern, path) => {
  if (path === undefined) {
    return false;
  } else if (_pathMatchers[pattern] === undefined) {
    _pathMatchers[pattern] = match(pattern);
  }
  return _pathMatchers[pattern](path);
};
