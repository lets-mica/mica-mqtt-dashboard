import dayjs from 'dayjs'

// 格式化时间
export const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化相对时间
export const formatRelativeTime = (timestamp: number) => {
  return dayjs(timestamp).fromNow()
}

// 格式化文件大小
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化数字
export const formatNumber = (num: number | undefined) => {
  if (num === undefined || num === null) {
    return '0'
  } else {
    return num.toLocaleString()
  }
}

// 格式化百分比
export const formatPercentage = (value: number, total: number) => {
  if (total === 0) return '0%'
  return ((value / total) * 100).toFixed(2) + '%'
}
