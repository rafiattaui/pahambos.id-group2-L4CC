import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircleIcon } from 'lucide-react';

interface IAlertDestructive {
  title: string;
  description: string;
}

export function AlertDestructive(props: IAlertDestructive) {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>{props.title}</AlertTitle>
      <AlertDescription>{props.description}</AlertDescription>
    </Alert>
  );
}
