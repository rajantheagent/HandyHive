import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';

// Root state interface - modules will add their own state slices
export interface AppState {}

// Root reducers - modules register their own reducers via lazy loading
export const reducers: ActionReducerMap<AppState> = {};

// Meta-reducers for development (logging, etc.)
export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
