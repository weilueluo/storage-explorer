import { CgSpinner } from 'react-icons/cg';

const LoadingComponent: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row gap-2 grow items-center justify-center text-xl">
      <CgSpinner className="animate-spin" />
      <span>loading ...</span>
    </div>
  );
};

export default LoadingComponent;
