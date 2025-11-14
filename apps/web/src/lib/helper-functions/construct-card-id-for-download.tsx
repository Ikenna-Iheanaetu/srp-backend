export const constructCardIdForDownload = (currentUserType:string,id: string) => {
    if(currentUserType){
      return `${currentUserType}-card-${id}`;
    }
    return `card-container-card-${id}`;
  }