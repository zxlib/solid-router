import { Component } from 'solid-js';
import { RouteMatch } from './utils';

/** User Route component properties */
export interface RouteProps {
  /** true to not use parent's prefixes */
  full?: boolean;
  /** use path as prefix for sub-routes */
  prefix?: boolean;
  /** path pattern */
  path?: string;
  /** is fallback? */
  fallback?: boolean;
  /** component to render */
  component?: Component;
  /** ...or children */
  children?: JSX.Element;
}

/** Route data model  */
export interface RouteModel extends RouteProps {
  /** full path pattern with all prefixes */
  pattern?: string;
  /** parent route model */
  parent?: ActiveRouteModel;
}

/** Active route model with match(if present) and without `children` */
export interface ActiveRouteModel extends Omit<RouteModel, 'children'> {
  /** concrete values matched */
  match: RouteMatch;
  /** full pattern prefix for nested routes */
  patternPrefix: string;
  /** prefix part of current url */
  linkPrefix: string;
}

export type ActiveRoute = ActiveRouteModel | false;

export const Route: Component<RouteProps> = (props) => props as any;
