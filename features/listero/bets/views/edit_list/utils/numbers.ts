import { AnnotationType, AnnotationTypes, GameTypeCodes, GameTypes } from "@/constants/Bet";

const emptyMsg = "Sin números";

export const numbersTwoDigits = (numbers: string) => {
    const pairs = [];
     
      for (let i = 0; i < numbers.length; i += 2) {
        if (i + 1 < numbers.length) {
          pairs.push(numbers.substring(i, i + 2));
        }
        else {
          pairs.push(numbers.charAt(numbers.length));
        }
      }
      console.log('pairs', numbers);
      return pairs.join(' - ');
  };
  export const numbersThreeDigits = (numbers: string) => {
    const pairs = [];
     
      for (let i = 0; i < numbers.length; i += 3) {
        if (i + 1 < numbers.length) {
          pairs.push(numbers.substring(i, i + 3));
        }
      }
      return pairs.join(' - ');
  };
  
  export const formatNumbers = (gameTypeCode:GameTypeCodes,annotationType:AnnotationType, numbers:string) => {
    console.log('Aqui pasaa', numbers);
    if(!gameTypeCode || !numbers || numbers=="Limpiar"){
        console.log('Aqui pasaa', emptyMsg);

      return emptyMsg;
    }
    
    if(annotationType === AnnotationTypes.Bet ){
  
      if (gameTypeCode === GameTypes.FIJOS_CORRIDOS  || gameTypeCode=== GameTypes.PARLET) {  
        return numbersTwoDigits(numbers); // Aplicar formato para el juego de fijo
      } else if (gameTypeCode ===GameTypes.CENTENA ) {
        return numbersThreeDigits(numbers);
      } 
    }
  
    return numbers;
  };

  export const splitStringToPairs = (inputString: string): string[] => {
    const pairs: string[] = [];
    for (let i = 0; i < inputString.length - (inputString.length % 2); i += 2) {
      pairs.push(inputString.substring(i, i + 2));
    }
    return pairs;
  };