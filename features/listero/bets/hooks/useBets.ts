import { useCallback } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../store';
import { MsgType } from '../store/types/index';
import { FijosCorridosBet, ParletBet, CentenaBet } from '../../../../types';

export const useBets = () => {
  const model = useBetsStore(selectBetsModel);
  const dispatch = useBetsStore(selectDispatch);

  const fetchBetTypes = useCallback((drawId: string) => {
    dispatch({ type: MsgType.FETCH_BET_TYPES_REQUESTED, drawId });
  }, [dispatch]);

  const updateFijosCorridos = useCallback((bets: FijosCorridosBet[]) => {
    dispatch({ type: MsgType.UPDATE_FIJOS_CORRIDOS, bets });
  }, [dispatch]);

  const updateParlets = useCallback((bets: ParletBet[]) => {
    dispatch({ type: MsgType.UPDATE_PARLETS, bets });
  }, [dispatch]);

  const updateCentenas = useCallback((bets: CentenaBet[]) => {
    dispatch({ type: MsgType.UPDATE_CENTENAS, bets });
  }, [dispatch]);

  const saveBets = useCallback((drawId: string) => {
    dispatch({ type: MsgType.SAVE_BETS_REQUESTED, drawId });
  }, [dispatch]);

  const resetBets = useCallback(() => {
    dispatch({ type: MsgType.RESET_BETS });
  }, [dispatch]);

  const openBetKeyboard = useCallback(() => {
    dispatch({ type: MsgType.OPEN_BET_KEYBOARD });
  }, [dispatch]);

  const closeBetKeyboard = useCallback(() => {
    dispatch({ type: MsgType.CLOSE_BET_KEYBOARD });
  }, [dispatch]);

  const openAmountKeyboard = useCallback((betId: string, amountType: 'fijo' | 'corrido') => {
    dispatch({ type: MsgType.OPEN_AMOUNT_KEYBOARD, betId, amountType });
  }, [dispatch]);

  const closeAmountKeyboard = useCallback(() => {
    dispatch({ type: MsgType.CLOSE_AMOUNT_KEYBOARD });
  }, [dispatch]);

  const processBetInput = useCallback((inputString: string) => {
    dispatch({ type: MsgType.PROCESS_BET_INPUT, inputString });
  }, [dispatch]);

  const submitAmountInput = useCallback((amountString: string) => {
    dispatch({ type: MsgType.SUBMIT_AMOUNT_INPUT, amountString });
  }, [dispatch]);

  const confirmApplyAmountAll = useCallback(() => {
    dispatch({ type: MsgType.CONFIRM_APPLY_AMOUNT_ALL });
  }, [dispatch]);

  const confirmApplyAmountSingle = useCallback(() => {
    dispatch({ type: MsgType.CONFIRM_APPLY_AMOUNT_SINGLE });
  }, [dispatch]);

  const cancelAmountConfirmation = useCallback(() => {
    dispatch({ type: MsgType.CANCEL_AMOUNT_CONFIRMATION });
  }, [dispatch]);

  const pressAddParlet = useCallback((fijosCorridosList: FijosCorridosBet[]) => {
    dispatch({ type: MsgType.PRESS_ADD_PARLET, fijosCorridosList });
  }, [dispatch]);

  const confirmParletBet = useCallback(() => {
    dispatch({ type: MsgType.CONFIRM_PARLET_BET });
  }, [dispatch]);

  const cancelParletBet = useCallback(() => {
    dispatch({ type: MsgType.CANCEL_PARLET_BET });
  }, [dispatch]);

  const editParletBet = useCallback((betId: string) => {
    dispatch({ type: MsgType.EDIT_PARLET_BET, betId });
  }, [dispatch]);

  const openParletAmountKeyboard = useCallback((betId: string) => {
    dispatch({ type: MsgType.OPEN_PARLET_AMOUNT_KEYBOARD, betId });
  }, [dispatch]);

  const deleteParletBet = useCallback((betId: string) => {
    dispatch({ type: MsgType.DELETE_PARLET_BET, betId });
  }, [dispatch]);

  const updateParletBet = useCallback((betId: string, changes: Partial<ParletBet>) => {
    dispatch({ type: MsgType.UPDATE_PARLET_BET, betId, changes });
  }, [dispatch]);

  const showParletDrawer = useCallback((visible: boolean) => {
    dispatch({ type: MsgType.SHOW_PARLET_DRAWER, visible });
  }, [dispatch]);

  const showParletModal = useCallback((visible: boolean) => {
    dispatch({ type: MsgType.SHOW_PARLET_MODAL, visible });
  }, [dispatch]);

  const showParletAlert = useCallback((visible: boolean) => {
    dispatch({ type: MsgType.SHOW_PARLET_ALERT, visible });
  }, [dispatch]);

  const closeAllDrawers = useCallback(() => {
    dispatch({ type: MsgType.CLOSE_ALL_DRAWERS });
  }, [dispatch]);

  const setActiveAnnotationType = useCallback((annotationType: string | null) => {
    dispatch({ type: MsgType.SET_ACTIVE_ANNOTATION_TYPE, annotationType });
  }, [dispatch]);

  const setActiveGameType = useCallback((gameType: string | null) => {
    dispatch({ type: MsgType.SET_ACTIVE_GAME_TYPE, gameType });
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch({ type: MsgType.CLEAR_ERROR });
  }, [dispatch]);

  // List View Actions
  const fetchBets = useCallback((drawId: string) => {
    dispatch({ type: MsgType.FETCH_BETS_REQUESTED, drawId });
  }, [dispatch]);

  // Create Bet Actions
  const setCreateDraw = useCallback((drawId: string) => {
    dispatch({ type: MsgType.SET_CREATE_DRAW, drawId });
  }, [dispatch]);

  const setCreateGameType = useCallback((gameType: any) => {
    dispatch({ type: MsgType.SET_CREATE_GAME_TYPE, gameType });
  }, [dispatch]);

  const updateCreateNumbers = useCallback((numbers: string) => {
    dispatch({ type: MsgType.UPDATE_CREATE_NUMBERS, numbers });
  }, [dispatch]);

  const updateCreateAmount = useCallback((amount: string) => {
    dispatch({ type: MsgType.UPDATE_CREATE_AMOUNT, amount });
  }, [dispatch]);

  const addBetToCreateList = useCallback(() => {
    dispatch({ type: MsgType.ADD_BET_TO_CREATE_LIST });
  }, [dispatch]);

  const removeBetFromCreateList = useCallback((index: number) => {
    dispatch({ type: MsgType.REMOVE_BET_FROM_CREATE_LIST, index });
  }, [dispatch]);

  const clearCreateSession = useCallback(() => {
    dispatch({ type: MsgType.CLEAR_CREATE_SESSION });
  }, [dispatch]);

  // Edit Bet Actions (Ranges)
  const setEditSelectedColumn = useCallback((column: string | null) => {
    dispatch({ type: MsgType.SET_EDIT_SELECTED_COLUMN, column });
  }, [dispatch]);

  const setEditSelectedCircle = useCallback((circle: number | null) => {
    dispatch({ type: MsgType.SET_EDIT_SELECTED_CIRCLE, circle });
  }, [dispatch]);

  const toggleRangeMode = useCallback((enabled: boolean) => {
    dispatch({ type: MsgType.TOGGLE_RANGE_MODE, enabled });
  }, [dispatch]);

  const setRangeType = useCallback((rangeType: 'continuous' | 'terminal' | null) => {
    dispatch({ type: MsgType.SET_RANGE_TYPE, rangeType });
  }, [dispatch]);

  const generateRangeBets = useCallback((start: string, end: string) => {
    dispatch({ type: MsgType.GENERATE_RANGE_BETS, start, end });
  }, [dispatch]);

  const updateEditInput = useCallback((value: string) => {
    dispatch({ type: MsgType.UPDATE_EDIT_INPUT, value });
  }, [dispatch]);

  // Rewards & Rules Actions
  const fetchRewards = useCallback((drawId: string) => {
    dispatch({ type: MsgType.FETCH_REWARDS_REQUESTED, drawId });
  }, [dispatch]);

  const fetchRules = useCallback((drawId: string) => {
    dispatch({ type: MsgType.FETCH_RULES_REQUESTED, drawId });
  }, [dispatch]);

  // New Create Business Logic Actions
  const handleKeyPress = useCallback((key: string) => {
    dispatch({ type: MsgType.HANDLE_KEY_PRESS, key });
  }, [dispatch]);

  const handleAmountSelection = useCallback((value: number) => {
    dispatch({ type: MsgType.HANDLE_AMOUNT_SELECTION, value });
  }, [dispatch]);

  const validateAndAddBet = useCallback((drawId: string) => {
    dispatch({ type: MsgType.VALIDATE_AND_ADD_BET, drawId });
  }, [dispatch]);

  const submitCreateSession = useCallback(() => {
    dispatch({ type: MsgType.SUBMIT_CREATE_SESSION });
  }, [dispatch]);

  const confirmClearBets = useCallback(() => {
    dispatch({ type: MsgType.CONFIRM_CLEAR_BETS });
  }, [dispatch]);

  return {
    ...model,
    fetchBetTypes,
    updateFijosCorridos,
    updateParlets,
    updateCentenas,
    saveBets,
    resetBets,
    openBetKeyboard,
    closeBetKeyboard,
    openAmountKeyboard,
    closeAmountKeyboard,
    processBetInput,
    submitAmountInput,
    confirmApplyAmountAll,
    confirmApplyAmountSingle,
    cancelAmountConfirmation,
    pressAddParlet,
    confirmParletBet,
    cancelParletBet,
    editParletBet,
    openParletAmountKeyboard,
    deleteParletBet,
    updateParletBet,
    showParletDrawer,
    showParletModal,
    showParletAlert,
    closeAllDrawers,
    setActiveAnnotationType,
    setActiveGameType,
    clearError,
    fetchBets,
    setCreateDraw,
    setCreateGameType,
    updateCreateNumbers,
    updateCreateAmount,
    addBetToCreateList,
    removeBetFromCreateList,
    clearCreateSession,
    setEditSelectedColumn,
    setEditSelectedCircle,
    toggleRangeMode,
    setRangeType,
    generateRangeBets,
    updateEditInput,
    fetchRewards,
    fetchRules,
    // New Create Business Logic Actions
    handleKeyPress,
    handleAmountSelection,
    validateAndAddBet,
    submitCreateSession,
    confirmClearBets,
  };
};
