export const TODAY = new Date()

export function isToday(date: Date) {
  const TODAY = new Date()

  return (
    date.getDate() === TODAY.getDate() &&
    date.getMonth() === TODAY.getMonth() &&
    date.getFullYear() === TODAY.getFullYear()
  )
}

export function dateFormat(date: Date) {
  return {
    hhmm() {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    ddmmyyyy() {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    ddmmyyyyhhmm() {
      return `${this.ddmmyyyy()} ${this.hhmm()}`
    },
    mmmdd() {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      })
    },
    mmmddyyyy() {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    mmmddyyyyhhmm() {
      return `${this.mmmddyyyy()} ${this.hhmm()}`
    },
    dd() {
      return date.toLocaleDateString('en-IN', { day: 'numeric' })
    },
    mmm() {
      return date.toLocaleString('en-IN', { month: 'short' })
    },
    mmmm() {
      return date.toLocaleString('en-IN', { month: 'long' })
    },
    mmmyy() {
      return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    }
  }
}
