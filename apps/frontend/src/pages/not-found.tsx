import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <span className="text-6xl font-bold text-muted-foreground">404</span>
      <span className="text-muted-foreground">Page not found</span>
      <Button variant="outline" size="sm" asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}

export default NotFound
