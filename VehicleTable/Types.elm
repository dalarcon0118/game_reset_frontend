module Parts.VehicleTable.Types exposing (..)
import Html exposing (Html)
import Parts.Filter.Types as FilterTypes
import RemoteData exposing (RemoteData, WebData)
import TaskNode exposing (TaskNode)
import Time exposing (Zone)
import ElasticSearch as ES


type alias CellIconType msg =
    {
        icon: Html msg,
        hoverText:String
    }


{-
type alias Params =
    {
      ticket:String
    }
-}

type alias Model =
    {
     vehicles: WebData (Response)
     ,tenant:WebData(String)
     ,total:Int
     ,from :Int
     ,to:Int
     ,perPage:Int
     ,ticket:String
     ,notary:String
     ,order:String
     ,sizeState:String
     ,filterState:String
     ,zone : Zone
     ,estadosQueryTermList : List ES.Query
    }

type alias Pagination =
    { pageSize:Int
     ,currentPage:Int
     ,from:Int
     ,to:Int
     }

type Msg
    = DataReceived (WebData (Response))
      | TenantLoaded(WebData (String))
      | Next
      | Previuos
      | GoDetail (String,String)
      | Sort
      | ShowSizePage
      | ChangePageSize(Int)
      | ResetRequest
      | FilterState
      | GetTimeZoneMsg Zone
      | MsgForFilter FilterTypes.Msg

type alias Response =
    { total : Int
    , result : List TaskNode
    }

type alias Wrapper =
    {
        source : VehicleBook
    }

type alias Query =
    {
        notaria:String
        ,from:Int
        ,perPage:Int
        ,order:String
        ,ticket:String
    }
type alias VehicleBook =
    { compradorNombreCompleto : String
    , notariaNumeroRepertorio : Int
    , vendedorNombreCompleto : String
    , tipoVehiculo : String
    , autoAnual : String
    , uniqueID : String
    , vendedorTipo : String
    , patente : String
    , compradorTipo : String
    , notariaAnoRepertorio : Int
    , compradorRut : String
    , notariaFechaAsignacionRepertorio : String
    , vendedorRut : String
    , marca : String
    , estadoAsignacionRepertorio : String
    , estadoPagoImpuesto : String
    , estadoDigitalizacion : String
    , estadoLegalizacion : String
    , notariaEstadoInscripcionRnvm : String
    , filterModel : FilterTypes.Model
    }

type State = Ready  --Círculo verde con check). Texto Hover: Impuesto Pagado.
           | Pending --(Reloj Gris).
           | Canceled --(Círculo rojo de anulación)
           | WaitingApproved {-(Circulo reloj azul)-}
           | PendingPayment {-simbolo $ en gris-}
           | PaymentDone {-simbolo $ en verde-}
           | DA {-no text-}
           | Error
           | DocGenerated
           | Warning

type alias Page =
    {
    currentPageCountStart:Int
    ,currentPageCountEnd:Int
    ,total:Int
    }
