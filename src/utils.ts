export function createUniqueId(addMin?: boolean) {
    const now = new Date();
    const year = now.getFullYear();
    const month = padZero(now.getMonth() + 1);
    const day = padZero(now.getDate());
    const hours = padZero(now.getHours());
    const minutes = addMin ? padZero(now.getMinutes()+1) : padZero(now.getMinutes());

    return `${year}${month}${day}${hours}${minutes}`
  }

 export function padZero(dayOrMonth: number) {
    let dayOrMonthString: string = dayOrMonth.toString()
    return dayOrMonthString.length == 1 ? `0${dayOrMonthString}` : dayOrMonthString;
  }