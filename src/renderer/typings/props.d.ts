import { RouteComponentProps } from 'react-router';
import * as H from 'history';

export interface RouteLocation extends H.Location {
  query: Record<string, string | string[] | null | undefined>;
}

export interface RouteProps extends RouteComponentProps<any> {
  location: RouteLocation;
}

export interface DispatchProps {
  dispatch: <A = any, S = any>(action: DvaAction<A>) => S
}
