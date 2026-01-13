module Parts.VehicleTable.View exposing (..)
import Html.Attributes exposing (alt, attribute, class, href, id, src, title)
import Html exposing (Attribute, Html, a, button, div, h2, h3, img, nav, node, p, span, table, tbody, td, text, tfoot, th, thead, tr)
import Html.Events exposing (onClick)


import RemoteData exposing (RemoteData(..))
import Svg exposing (svg, path, rect, pattern)
import Svg.Attributes exposing (fillRule, viewBox, fill, r, d, clipRule, stroke, strokeWidth, points, x, y, ry, cy, cx, rx, height, width, transform, style)
import TaskNode exposing (TaskNode)
import Csf.DateFormat as DateFormat exposing (formatIsoDate)
import Dict exposing (Dict)
import Time exposing (utc, Zone)

import Parts.VehicleTable.PageDrop exposing (..)
{-
import Parts.FilterMenu exposing (filterMenu)-}
import Parts.VehicleTable.Types exposing (..)
import Parts.Resources.Icon exposing (..)

orderColumn : Model -> List(Html Msg)
orderColumn model =
        [th [ class "px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider" ][
            div [class "flex"][
                text "REPERTORIO",(if model.order=="desc" then (arrowDown Sort)  else (arrowUp Sort))
            ]
        ]
        ]

textViewCol : String -> Html Msg
textViewCol col =
    th [ class "px-6 w-40 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider" ]
       [ text col ]
viewCol : String -> Html Msg
viewCol col =
   th [ class "px-6 py-3 bg-gray-50 text-center text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider" ]
       [ text col ]


viewPageBar: Model -> Html Msg
viewPageBar model =
     div [ class "bg-white px-4 py-3 flex items-end border-t border-gray-200 sm:px-6" ][
         div [ class "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between" ][
              div [][
                    p [ class "text-sm text-gray-700" ][
                       pageSize model
                       ,div[class "inline-block align-top"][
                             span [ class "font-medium" ][ text (String.fromInt model.perPage) ]
                            ,span[][text " Actuaciones por Página "]
                       ]
                    ]
               ]
         , div [class "flex"][
             div [ class " text-sm text-gray-700 px-2 py-2" ][
                  text "Mostrando "
                 ,span [ class "font-medium" ][
                    text (String.fromInt (model.from+1))
                 ]
                 , text " a "
                 , span [ class "font-medium" ][
                        text (String.fromInt (if model.to > model.total then model.total else model.to))
                 ]
                 ,text " de "
                 , span [ class "font-medium" ]
                   [(
                    case model.vehicles of
                          NotAsked ->
                              text ""

                          Loading ->
                              text "Cargando..."

                          Success vehicles ->
                               text(String.fromInt vehicles.total)

                          Failure _ ->
                              text "Cargando datos"
                    )]

             ]
           ,nav [ attribute "aria-label" "Pagination", class " inline-flex shadow-sm -space-x-px" ]
               [ a [ onClick Previuos, class " inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50", href "#" ]
                   [ span [ class "sr-only" ]
                       [ text "Anterior" ]
                   , svg [ attribute "aria-hidden" "true", Svg.Attributes.class "h-5 w-5", fill "currentColor", viewBox "0 0 20 20", attribute "xmlns" "http://www.w3.org/2000/svg" ]
                       [ path [ attribute "clip-rule" "evenodd", d "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z", attribute "fill-rule" "evenodd" ]
                           []
                       , text "          "
                       ]
                   ]
               , a [onClick Next, class " inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50", href "#" ]
                   [ span [ class "sr-only" ]
                       [ text "Siguiente" ]
                   , svg [ attribute "aria-hidden" "true", Svg.Attributes.class "h-5 w-5", fill "currentColor", viewBox "0 0 20 20", attribute "xmlns" "http://www.w3.org/2000/svg" ]
                       [ path [ attribute "clip-rule" "evenodd", d "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", attribute "fill-rule" "evenodd" ]
                           []
                       ]
                   ]
               ]
           ]
       ]
        ]

column =
    td[]

textColumns = ["VENDEDOR","COMPRADOR","VEHÍCULO    PPU|TIPO|MARCA|AÑO"]
statecolumns = ["ASIGNACIÓN REPERTORIO","PAGO IMPUESTO","DIGITALIZACIÓN DOCUMENTO","LEGALIZACIÓN DOCUMENTO","TRANSFERENCIA RVM"]







getCurrentIcon state =
    case state of
        Ready -> circleCheck
        Pending -> clock
        Canceled -> nullIcon
        WaitingApproved -> clockWait
        PendingPayment -> pendingPaymentIcon
        PaymentDone -> paymentDone
        DA -> dontApply
        Error -> errorIcon
        Warning-> warningIcon
        DocGenerated -> newDoc
       {- _ -> noText-}


repertoryParse data =
        case data of
            "asignado" -> {icon=getCurrentIcon Ready,hoverText="Repertorio Asignado"}
            _ -> {icon = getCurrentIcon DA ,hoverText = ""}

{-Pago Impuesto:
Pendiente - No se ha pagado el impuesto (Reloj Gris). Texto Hover: Pendiente.
Impuesto Pagado - (Círculo verde con check). Texto Hover: Impuesto Pagado.
N/A - Cuando no hay pago de impuesto.Texto Hover: No Aplica
Anulado- Fue anulado antes de pagar el impuesto(Círculo rojo de anulación).
Texto Hover: Anulado. En este caso el estado para el resto de las columnas a la derecha se muestra en blanco.-}
taxPayment data =
    case data of
        "pagado" ->  {icon=getCurrentIcon Ready,hoverText="Impuesto Pagado"}
        "anulado"->  {icon=getCurrentIcon Canceled,hoverText="Anulado"}
        "pendiente" -> {icon=getCurrentIcon Pending,hoverText="Pendiente"}
        "no_aplica"-> {icon=getCurrentIcon DA,hoverText=" No Aplica"}
        _ -> {icon=noText,hoverText=""}
{-Digitalización Documento:
Pendiente - No se ha digitalizado (Reloj Gris). Texto Hover: Pendiente.
N/A- No Aplica la digitalización porque es un contrato electrónico o una legalización electrónica de un contrato físico (N/A). Texto Hover: No Aplica.
Digitalizado por Aprobar - Ya se digitalizó ahora está en la revisión de la digitalización (Reloj azul con flecha).Texto Hover: Digitalizado por Aprobar.
Digitalizado - Ya fue digitalizado y aprobada su digitalización (Círculo verde con check). Texto Hover: Digitalizado.-}

docProcess data =
    case data of
        "pendiente" -> {icon=getCurrentIcon Pending,hoverText="Pendiente"}
        "digitalizado_por_aprobar" -> {icon=getCurrentIcon WaitingApproved,hoverText="Digitalizado por Aprobar"}
        "digitalizado" -> {icon=getCurrentIcon Ready,hoverText="Digitalizado"}
        "no_aplica"-> {icon=getCurrentIcon DA,hoverText="No Aplica"}
        _ -> {icon=noText,hoverText=""}
{-Legalización Documento:
Pendiente - No se ha legalizado el documento (Reloj Gris). Texto Hover: Pendiente.
Documento Legalizado - Se legalizó exitosamente (Círculo verde con check). Texto Hover. Legalizado.-}
legalDoc data =
    case data of
        "pendiente"-> {icon=getCurrentIcon Pending,hoverText="Pendiente"}
        "legalizado"-> {icon=getCurrentIcon Ready,hoverText="Legalizado"}
        _ -> {icon=noText,hoverText=""}
{-
Pendiente - Cuando no ha llegado a la tarea Solicitar Inscripción (Reloj Gris). Texto Hover: Pendiente.
Solicitud con Error - Cuando al pasar la tarea Solicitar Inscripción RVM devuelve error (Círculo Naranja de Warning). Texto Hover: Solicitud con Error.
Solicitud Ingresada - Cuando al pasar la tarea Solicitar Inscripción queda ingresada (Reloj azul con flecha). Texto Hover: Solicitud Ingresada.
Pendiente de Pago - Cuando se encuentra en la tarea Adjuntar evidencias del pago (Círculo con $ Gris). Texto Hover: Pendiente de Pago.
Solicitud Pagada - Cuando sale de la tarea Adjuntar evidencias del pago (Círculo con $ Verde). Texto Hover: Solicitud Pagada.
Solicitud Rechazada - Cuando al consultar el estado RVM rechaza. (Círculo Rojo de error). Texto Hover: Solicitud Rechazada.
Solicitud con Error de Reingreso - Cuando al pasar por la tarea Solicitar Reingreso RVM devuelve error (Círculo Naranja de Warning). Texto Hover: Solicitud con Error de Reingreso.
Solicitud Reingresada - Cuando se reingresa (Reloj azul con flecha). Texto Hover: Solicitud Reingresada.
Vehículo Inscrito - Cuando RVM Acepta la solicitud (Círculo verde con check). Texto Hover. Vehículo Inscrito.
Proceso Anulado - Cuando un usuario anula el proceso (Círculo rojo de anulación). Texto Hover: Anulado. -}
tranference data =
    case data of
         "pendiente"-> {icon=getCurrentIcon Pending,hoverText="Pendiente"}
         "solicitud_con_errores"-> {icon= getCurrentIcon Warning,hoverText="Solicitud con Error"}
         "solicitud_ingresada"-> {icon=getCurrentIcon WaitingApproved,hoverText="Solicitud Ingresada"}
         "solicitud_pendiente_pago"-> {icon=getCurrentIcon PendingPayment,hoverText="Pendiente de Pago"}
         "solicitud_pagada"-> {icon=getCurrentIcon PaymentDone,hoverText="Solicitud Pagada"}
         "solicitud_transferencia_obtenida"-> {icon=getCurrentIcon DocGenerated,hoverText="Solicitud Obtenida"}
         "solicitud_rechazada"-> {icon=getCurrentIcon Error,hoverText="Solicitud Rechazada"}
         "solicitud_con_errores_reingreso"-> {icon=getCurrentIcon Warning,hoverText="Solicitud con Error de Reingreso"}
         "solicitud_reingresada"-> {icon=getCurrentIcon WaitingApproved,hoverText="Solicitud Reingresada"}
         "vehiculo_inscrito"-> {icon=getCurrentIcon Ready,hoverText="Vehículo Inscrito"}
         "tramite_anulado"->{icon= getCurrentIcon Canceled,hoverText="Anulado"}
         _ -> {icon=noText,hoverText=""}


cellIcon: CellIconType msg -> Html msg
cellIcon iconCell =
    div[class "flex justify-center 'tooltip'"]
        [ span [title iconCell.hoverText]
            [ iconCell.icon]

        ]

tupla: List (String, String)
tupla =
  [ ("ene", "Enero")
  , ("feb", "Febrero")
  , ("mar","Marzo")
  , ("abr","Abril")
  , ("may","Mayo")
  , ("jun","Junio")
  , ("jul","Julio")
  , ("ago","Agosto")
  , ("sep","Septiembre")
  , ("oct","Octubre")
  , ("nov","Noviembre")
  , ("dic","Diciembre")
  ]

fechaUTCToISO : Zone -> String -> String
fechaUTCToISO zone fechaHora =
  let
    month = (Maybe.withDefault "" <| formatIsoDate "MMM" zone fechaHora)
  in
    formatIsoDate "DD de MMM YYYY HH:mm" zone fechaHora
    |> Maybe.withDefault fechaHora
    |> String.replace month ( translate month )

translate : String ->String
translate str =
    tupla
    |> Dict.fromList
    |> Dict.get str
    |> Maybe.withDefault ""

viewCell : Model -> TaskNode -> Html Msg
viewCell model {id, properties} =
  let
    get func = func properties --obtener la info de properties
    string_ str = Maybe.withDefault "" <| get <| TaskNode.string str --obtener dato tipo string
    int_ str = Maybe.withDefault 0 <| get <| TaskNode.int str --obtener dato tipo enteros
    format date  = Maybe.withDefault "" <| DateFormat.formatIsoDate "DD de MMM YYYY HH:mm" utc date
  in
   tr []
     [  td [ class "px-6 py-4 whitespace-no-wrap align-top" ]
            [ div [ class "text-sm leading-5 text-gray-900" ]
                [ a [ onClick  (GoDetail <| (string_ "unique_id" , (String.fromInt <| int_ "notaria_numero_repertorio")) ) , class "text-blue-600 cursor-pointer hover:underline"][text <| String.fromInt <| int_ "notaria_numero_repertorio"]
                , div [ ][text <| fechaUTCToISO model.zone ( string_ "notaria_fecha_asignacion_repertorio")]
                ]
            ]
        , td [ class "px-6 py-4 whitespace-no-wrap align-top" ]
            [ div [ class "text-sm leading-5 text-gray-900" ]
                [ div [class "w-36"][text <| string_ "comprador_rut"]
                , div [class "w-36" ][text <| string_  "comprador_nombre_completo"]
                ]
            ]
        , td [ class "px-6 py-4 whitespace-no-wrap align-top" ]
             [ div [ class "text-sm leading-5 text-gray-900" ]
                 [ div [class "w-36"][text <| string_  "vendedor_rut"]
                 , div [class "w-36"][text <| string_  "vendedor_nombre_completo"]
                 ]
             ]
        , td [ class "px-6 py-4 whitespace-no-wrap align-top" ]
              [ div [ class "text-sm leading-5 text-gray-900" ]
                 [ div[class "w-36"] [ text (string_ "patente" ++ " | "++ string_ "tipo_vehiculo" ++" | "  )]
                 , div[class "w-36"] [ text (string_ "marca" ++" | "++ string_ "auto_anual")]
                 ]
              ]
        ,column
            [
                cellIcon (repertoryParse <| string_ "estado_asignacion_repertorio")
            ]
        ,column
            [cellIcon(taxPayment <| string_ "estado_pago_impuesto")]
        ,column[
            div [class "w-6 h-6 ml-16" ][if(taxPayment <| string_ "estado_pago_impuesto").hoverText  /= "Anulado" then cellIcon(docProcess <| string_ "estado_digitalizacion") else text ""]
         ]
        ,column[
            div [class "w-6 h-6 ml-16" ][if(taxPayment <| string_ "estado_pago_impuesto").hoverText  /= "Anulado" then cellIcon(legalDoc <| string_ "estado_legalizacion") else text ""]
         ]
        ,column[
            div [class "w-6 h-6 ml-16" ][if(taxPayment <| string_ "estado_pago_impuesto").hoverText  /= "Anulado" then cellIcon(tranference <| string_ "notaria_estado_inscripcion_rnvm") else text ""]
         ]
         ]


loadingIndicator =
    [div[][
        svg [ Svg.Attributes.class "animate-spin -ml-1 mr-3 h-5 w-5 text-white", fill "none", viewBox "0 0 24 24", attribute "xmlns" "http://www.w3.org/2000/svg" ]
            [ node "circle" [ Svg.Attributes.class "opacity-25", attribute "cx" "12", attribute "cy" "12", attribute "r" "10", attribute "stroke" "currentColor", attribute "stroke-width" "4" ]
               []
           , path [ Svg.Attributes.class "opacity-75", d "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z", fill "currentColor" ]
               []
        ]
        ,text "Cargando.."
      ]
    ]

renderData : Model -> List(Html Msg)
renderData model =
     case model.vehicles of
          NotAsked -> [text ""]

          Loading -> [text "Cargando"]

          Success  vehicles ->
              if(model.total == 0)
              then [emptySearch]
             else List.map (viewCell model) vehicles.result

          Failure _ -> loadingIndicator



tableBody : Model -> Html Msg
tableBody model =
    {-let _ = Debug.log model.order
    in-}
    div [ class "flex flex-col border shadow-xl sm:rounded-lg bg-white" ][
         div [ class "-my-2 sm:-mx-6 lg:-mx-8 overflow-x-auto" ][
            div [ class "py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8" ][
                div [ class "shadow overflow-hidden border-gray-200 sm:rounded-lg" ][
                    table [ class "min-w-full divide-y divide-gray-200" ][
                          thead [][
                                tr []
                                    (List.concat [ orderColumn model, List.map textViewCol textColumns,List.map viewCol statecolumns])
                           ]
                           ,tbody [ class "bg-white divide-y divide-gray-200" ](renderData model)

                    ]
                ]
            ]
        ]
        ,viewPageBar model
    ]


view: Model-> Html Msg
view model =
    div[][
        div [](
            case model.vehicles of
                      NotAsked -> [text ""]

                      Loading -> [text "Cargando"]

                      Success vehicles ->
                          if(model.total == 0)
                          then [emptySearch]
                         else [tableBody model]

                      Failure _ -> loadingIndicator

        )
    ]

