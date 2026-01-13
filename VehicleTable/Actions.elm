port module Parts.VehicleTable.Actions exposing (..)
import Data exposing (getVehicleBook,getPrimaryTenant)
import Maybe exposing (Maybe)
import RemoteData exposing (RemoteData(..))

import Json.Encode as Encode exposing (Value)
import Dict
import TaskNode exposing (TaskNode)
import Return exposing (Return, return)
import Time exposing (utc, Zone)
import Task exposing (Task)

import Parts.VehicleTable.Types exposing (..)
import Types as MainType


port jsonConsole : Value -> Cmd msg
port goToShell : Value -> Cmd msg



tknode2Value: List TaskNode -> Value
tknode2Value = Encode.object << List.concat << List.map (.properties >> Dict.toList)

init :MainType.Params -> Return Msg Model
init param  =
    return
        {
            vehicles = RemoteData.NotAsked,
            from = 0,
            perPage = 10,
            to = 10,
            ticket = param.ticket,
            notary = "",
            total =  0,
            tenant = RemoteData.NotAsked,
            order = "desc",
            sizeState = "invisible"
            , filterState = "invisible"
            , zone = utc
            ,estadosQueryTermList = []
         }
          (Task.perform GetTimeZoneMsg Time.here)


initRequest :  Model -> ( Model, Cmd Msg )
initRequest model =
    ( model
    , Task.perform GetTimeZoneMsg Time.here
    )

nextPage:Model->(Model)
nextPage model =  if model.to <model.total  then ({model| from = model.from + model.perPage, to = model.to + model.perPage}) else model

previousPage:Model->(Model)
previousPage model = if model.from > 0 then ({model| from = model.from - model.perPage, to = model.to - model.perPage}) else model

sort:Model->(Model)
sort  model = if model.order == "desc" then ({model| order = "asc"}) else ({model| order = "desc"})

setDropDownPage model = if model.sizeState == "invisible" then ({model| sizeState = "visible"}) else ({model| sizeState = "invisible"})

changePage:Int->Model->(Model)
changePage size model=
    ({model | perPage = size,to = model.from+size})


update : MainType.Msg -> Model -> Return Msg Model
update msgFor model =
    case msgFor of
        MainType.MsgForVehicleTable msg -> updateVehicle msg model
        _ -> return model Cmd.none

updateVehicle msg model =
    case msg of
        TenantLoaded tenant->
            case tenant of
                Success notary ->
                     let
                        currentModel = ({ model | notary = notary})
                     in
                    return currentModel( getVehicleBook currentModel)
                _ ->  return model Cmd.none
        DataReceived (RemoteData.Success data) ->
                    return { model | vehicles = RemoteData.Success data, total = data.total } (jsonConsole <| tknode2Value data.result)
        DataReceived response ->
            return { model | vehicles = response} (jsonConsole <| Encode.object [("example", Encode.string "error")] )
        Next ->
            let current = nextPage model
            in return {model | vehicles = RemoteData.Loading, from = current.from,to = current.to }(getVehicleBook current)
        Previuos ->
            let current = previousPage model
            in return {model | vehicles = RemoteData.Loading, from = current.from,to = current.to }(getVehicleBook current)
        GoDetail (id, notaria_numero_repertorio) ->
                 return  model ( goToShell <| Encode.object [("unique_id", Encode.string id),("notaria_numero_repertorio", Encode.string notaria_numero_repertorio)])
        Sort ->
             let
                current = sort model
             in return {model | vehicles = RemoteData.Loading, order = current.order}(getVehicleBook current)
        ShowSizePage ->
            let current = setDropDownPage model
            in
                return  current(Cmd.none )
        ChangePageSize size ->
             let current = model
                    |> \_-> ({model|from =0})
                    |> changePage size
                    |> setDropDownPage

              in
              return current (getVehicleBook current)
        ResetRequest  ->
             let current = model
                    |> \_-> ({model|from =0})
                    |> changePage 10

              in
              return current (getVehicleBook current)


        GetTimeZoneMsg subMsg -> onGetTimeZone subMsg model
        _ ->
               return model Cmd.none


onGetTimeZone : Zone -> Model -> (Model, Cmd Msg)
onGetTimeZone zone model =
  return { model | zone = zone }(getPrimaryTenant { model | zone = zone }
  )
