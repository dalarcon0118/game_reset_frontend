import { useEffect } from 'react';
import { useSettingsStore, selectDispatch, selectUser, selectSecurity, selectPreferences, selectExpandedSections, selectRules } from '../store';
import { useAuth } from '../../../auth';
import { SET_USER_DATA, FETCH_RULES_REQUESTED } from '../store/types';

export const useSettings = () => {
    const dispatch = useSettingsStore(selectDispatch);
    const user = useSettingsStore(selectUser);
    const security = useSettingsStore(selectSecurity);
    const preferences = useSettingsStore(selectPreferences);
    const rules = useSettingsStore(selectRules);
    const expandedSections = useSettingsStore(selectExpandedSections);
    const { user: authUser } = useAuth();

    useEffect(() => {
        if (authUser) {
            dispatch(SET_USER_DATA({
                name: authUser.name || authUser.username || '',
                email: authUser.email || '',
                role: authUser.role
            }));
            dispatch(FETCH_RULES_REQUESTED());
        }
    }, [authUser]);

    return {
        dispatch,
        user,
        security,
        preferences,
        rules,
        expandedSections
    };
};
