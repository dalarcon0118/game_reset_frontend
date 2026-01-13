module Parts.VehicleTable.PageDrop exposing (..)
import Html.Attributes exposing (attribute,id, src, alt,href,class,action,method)
import Html exposing (..)
import Html.Events exposing (onClick)
import Svg exposing (svg, path, rect, pattern)
import Svg.Attributes exposing ( viewBox, fill,  d,id)
import Parts.VehicleTable.Types exposing (Msg(..))

listOfPage =
    ["10","20","50","100"]
numberPageOption num =
         a [ onClick (ChangePageSize <|Maybe.withDefault 0<| (String.toInt num) ), class "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900", href "#", attribute "role" "menuitem" ][
            text num]
pageSize model =
    div [ class "relative inline-block text-left" ]
        [ div []
            [ button [ onClick ShowSizePage, attribute "aria-expanded" "true", attribute "aria-haspopup" "true", class "rounded-full flex items-center text-gray-400 hover:text-gray-600 focus:outline-none" ]
                [ span [ class "sr-only" ]
                    [ text "Open options" ]
                , svg [ attribute "aria-hidden" "true", Svg.Attributes.class "h-5 w-5", fill "currentColor", viewBox "0 0 20 20", attribute "xmlns" "http://www.w3.org/2000/svg" ]
                    [ path [ d "M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" ]
                        []
                    , text "      "
                    ]
                ]
            ]
        , div [ class (model.sizeState ++" visible absolute bottom-0 mb-4 shadow-lg w-13 rounded-md left-0 ") ]
            [ div [ attribute "aria-labelledby" "options-menu", attribute "aria-orientation" "vertical", class "py-1 bg-white rounded-md shadow-xs", attribute "role" "menu" ]
                    (List.map numberPageOption listOfPage)

            ]
        ]
