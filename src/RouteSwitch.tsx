import { RouteSwitchProps } from './RouteSwitchBase';
import { Component } from 'solid-js';
import { useRouter } from './RouterProvider';

export * from './RouteSwitchBase';

export const RouteSwitch: Component<RouteSwitchProps> = (props) => {
  const router = useRouter();
  return <router.Switch {...props} />;
};
