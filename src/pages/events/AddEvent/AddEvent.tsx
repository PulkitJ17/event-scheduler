import { ChangeEvent, FC, useContext, useEffect, useState } from 'react';
import { MdSaveAlt } from 'react-icons/md';
import EventBody from '../../../components/EventBody/EventBody';
import Spinner from '../../../components/UI/Spinner/Spinner';
import Alert from '../../../components/UI/Alert/Alert';
import AuthContext from '../../../store/auth-context';
import { useSaveEventMutation } from '../../../generated/graphql';

const AddEvent: FC = () => {
  const [title, setTitle] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [disableSaveBtn, setDisableSaveBtn] = useState<boolean>(true);
  const [displayForm, setDisplayForm] = useState<boolean>(true);

  const [loggedIn, setLoggedIn] = useState<boolean>(true);

  const [saveEvent, { error, data, loading }] = useSaveEventMutation({
    variables: { event: { id: '', title, start, end, isPrivate, description } },
  });

  const authCtx = useContext(AuthContext);

  useEffect(() => setLoggedIn(!!authCtx.getAuth()), [authCtx]);

  const handleOnSubmit = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayForm(false);
    saveEvent()
      .then((_) => {
        setTitle('');
        setDescription('');
        setStart('');
        setEnd('');
        setIsPrivate(false);
        setDisableSaveBtn(true);
      })
      .catch((error) => console.error(error.message))
      .finally(() => setDisplayForm(true));
  };

  return (
    <div>
      {!loggedIn && (
        <Alert
          msg="You must log in to be able to add events."
          type="warning"
          ariaLabel="Warning:"
          fillType="#exclamation-triangle-fill"
        />
      )}
      {data && (
        <Alert
          msg="Event was successfully added."
          type="success"
          ariaLabel="Success:"
          fillType="#check-circle-fill"
        />
      )}
      {error && (
        <Alert
          msg="Error occurred while saving event! Please try again later."
          type="danger"
          ariaLabel="Warning"
          fillType="#exclamation-triangle-fill"
        />
      )}
      {loading ? (
        <Spinner />
      ) : (
        <form className="row g-3" onSubmit={handleOnSubmit}>
          {displayForm && (
            <div className="col-12">
              <EventBody
                title={title}
                start={start}
                end={end}
                isPrivate={false}
                description={description}
                disableEdit={!loggedIn}
                onTitle={(title) => setTitle(title)}
                onDescription={(description) => setDescription(description)}
                onStart={(start) => setStart(start)}
                onEnd={(end) => setEnd(end)}
                onIsPrivate={(isPrivate) => setIsPrivate(isPrivate)}
                onValidate={(valid) => setDisableSaveBtn(!valid)}
              />
            </div>
          )}

          <div className="col-12 mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={disableSaveBtn || loading || !loggedIn}
            >
              Save <MdSaveAlt />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddEvent;
