import { Component, createMemo, splitProps } from 'solid-js';
import { useRouter } from './RouterProvider';
import { useRouteSwitch } from './RouteSwitch';
import { ComponentProps } from './utils';

type AnchorProps = JSX.IntrinsicElements['a'];
type ButtonProps = JSX.IntrinsicElements['button'];
type OnClick = AnchorProps['onClick'];

/** Base props for wrapper, wrapped and end-user component) */
export interface LinkPropsBase {
  /** target route path */
  path: string;
  /** take the path as full, so ignore parent routes paths */
  full?: boolean;
  /** custom onClick handler */
  onClick?: OnClick;
  // children?: JSX.Element | JSX.Element[];
}

/** Props passed from LinkWrapper to wrapped component as second argument */
export interface WrappedComponentProps {
  /** full path of the route */
  fullPath: string;
  /** is the link match the active route */
  isActive: boolean;
}

/** Wrapped component function: using two arguments to split final props and link related ones */
export type WrappedComponent<P extends {} = AnchorProps> = (
  /** final component props without link props and with onClick handler */
  props: ComponentProps<Component<P>>,
  /** link related props: fullPath, isActive, etc */
  link: WrappedComponentProps,
) => JSX.Element;

export type OmitWrappedProps<T> = Omit<T, 'linkPath' | 'linkActive'>;

export type LinkWrapperProps<
  P extends {} = AnchorProps,
  C extends WrappedComponent<P> = WrappedComponent<P>
> = OmitWrappedProps<LinkPropsBase & ComponentProps<C>> & { component: C };

export function LinkWrapper<
  P extends {} = {},
  C extends WrappedComponent<P> = WrappedComponent<P>
>(props: LinkWrapperProps<P, C>): JSX.Element {
  const { push, isPathActive } = useRouter();
  const routeSwitch = useRouteSwitch();

  const getLinkPath = createMemo(() => {
    let res = '';
    if (!props.full) {
      const route = routeSwitch?.getRoute();
      if (route) {
        res = route.linkPrefix;
      }
    }
    return res + props.path;
  });

  const getParams = createMemo<[P, WrappedComponentProps]>(() => {
    const [link, rest] = splitProps(props, [
      'path',
      'full',
      'onClick',
      'component',
    ]);
    const linkPath = getLinkPath();
    const linkActive = !!isPathActive(linkPath);

    const handleClick: OnClick = (event) => {
      event.preventDefault();
      push(linkPath);
      if (typeof props.onClick === 'function') {
        props.onClick(event);
      }
    };

    return [
      { ...(rest as any), onClick: handleClick },
      { ...link, fullPath: linkPath, isActive: linkActive },
    ];
  });

  return () => props.component(...getParams());
}

export function createLinkComponent<P extends {} = AnchorProps>(
  WrappedComponent: WrappedComponent<P>,
): Component<P & LinkPropsBase> {
  return (props: any) => (
    <LinkWrapper {...props} component={WrappedComponent} />
  );
}

export const Link = createLinkComponent((props, link) => (
  <a href={link.fullPath} {...props} />
));

export const ButtonLink = createLinkComponent<ButtonProps>((props, link) => (
  <button {...props} disabled={link.isActive} />
));
