import { NetworkStatus } from '@apollo/client';
import { ChangeEvent, FC, useContext, useEffect, useState } from 'react';
import useDebounce from '../../../hooks/useDebounce';
import Spinner from '../../../components/UI/Spinner/Spinner';
import Card from '../../../components/UI/Card/Card';
import Alert from '../../../components/UI/Alert/Alert';
import Pagination from '../../../components/Pagination/Pagination';
import { IEvent } from '../../../interfaces/types';
import AuthContext from '../../../store/auth-context';
import Modal from '../../../components/UI/Modal/Modal';
import EventBody from '../../../components/EventBody/EventBody';
import { Form } from 'react-bootstrap';
import {
  useDeleteEventMutation,
  useGetEventsQuery,
  useSaveEventMutation,
} from '../../../generated/graphql';
import { EventCardContainer, EventCardWrapper } from './styles';

const EVENTS_PER_PAGE = 20;

const SearchEvents: FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showModal, setShowModal] = useState<boolean>(false);
  const debouncedSearchText = useDebounce(searchText);

  const [title, setTitle] = useState<string>('');
  const [id, setId] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [createdById, setCreatedById] = useState<string>('');

  const [displayDeleteBtn, setDisplayDeleteBtn] = useState<boolean>(false);
  const [hideSaveBtn, setHideSaveBtn] = useState<boolean>(true);
  const [disableSaveBtn, setDisableSaveBtn] = useState<boolean>(false);
  const [disableDeleteBtn, setDisableDeleteBtn] = useState<boolean>(false);

  const [allCheck, setAllCheck] = useState<boolean>(true);
  const [currentCheck, setCurrentCheck] = useState<boolean>(false);
  const [expiredCheck, setExpiredCheck] = useState<boolean>(false);

  const authCtx = useContext(AuthContext);

  const { loading, data, error, refetch, networkStatus } = useGetEventsQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: {
      filter: {
        searchText: debouncedSearchText.trim(),
        pageSize: EVENTS_PER_PAGE,
        pageNumber: currentPage,
        currentCheck,
        expiredCheck,
      },
    },
  });

  const [saveEvent, { error: saveEventError, loading: saveEventLoading }] =
    useSaveEventMutation();

  const [
    deleteEvent,
    { error: deleteEventError, loading: deleteEventLoading },
  ] = useDeleteEventMutation();

  const handleOnSubmit = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    refetch();
  };

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const getExSubTitle = (endTime: string) => {
    const today = new Date();
    const endDate = new Date(endTime);

    return endDate.getTime() < today.getTime() ? 'Expired' : '';
  };

  const clickEventHandler = (event: IEvent) => {
    setTitle('Update Event');

    const auth = authCtx.getAuth();

    if (auth) {
      const equal = auth.userId === event.createdBy._id;
      setDisplayDeleteBtn(equal);
      setHideSaveBtn(!equal);
      setDisableSaveBtn(!equal);
    } else {
      setDisplayDeleteBtn(false);
      setHideSaveBtn(true);
    }

    setId(event.id ?? '');
    setEventTitle(event.title);
    setStart(event.start);
    setEnd(event.end);
    setIsPrivate(event.isPrivate);
    setDescription(event.description);
    setCreatedById(event.createdBy._id);
    setShowModal(true);
  };

  const handleDeleteEvent = () => {
    setDisableDeleteBtn(true);
    setDisableSaveBtn(true);

    deleteEvent({
      variables: { id },
    })
      .then(() => {
        setCurrentPage(1);
        refetch();
      })
      .finally(() => {
        setDisableDeleteBtn(false);
        setDisableSaveBtn(false);
      });
  };

  const handleSaveEvent = () => {
    setDisableDeleteBtn(true);
    setDisableSaveBtn(true);

    saveEvent({
      variables: {
        event: {
          id,
          title: eventTitle,
          start,
          end,
          isPrivate,
          description,
        },
      },
    })
      .then(() => refetch())
      .finally(() => {
        setDisableDeleteBtn(false);
        setDisableSaveBtn(false);
      });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => {
    setCurrentPage(1);
    refetch();
  }, [authCtx, refetch]);

  const handleFilterByAllEventsChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setCurrentPage(1);
    setAllCheck(!allCheck);
    setCurrentCheck(false);
    setExpiredCheck(false);
  };

  const handleFilterByCurrentEventsChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    e.persist();
    setCurrentPage(1);
    setCurrentCheck(!currentCheck);
    setAllCheck(false);
    setExpiredCheck(false);
  };

  const handleFilterByExpiredEventsChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    e.persist();
    setCurrentPage(1);
    setExpiredCheck(!expiredCheck);
    setAllCheck(false);
    setCurrentCheck(false);
  };

  return (
    <>
      {error && (
        <Alert
          msg={error.message}
          type="danger"
          ariaLabel="Warning"
          fillType="#exclamation-triangle-fill"
        />
      )}

      {saveEventError && (
        <Alert
          msg={saveEventError.message}
          type="danger"
          ariaLabel="Warning"
          fillType="#exclamation-triangle-fill"
        />
      )}

      {deleteEventError && (
        <Alert
          msg={deleteEventError.message}
          type="danger"
          ariaLabel="Warning"
          fillType="#exclamation-triangle-fill"
        />
      )}

      <Form>
        <div className="mb-4">
          <span className="me-3 fs-5">Filter by: </span>
          <Form.Check
            inline
            label="All"
            name="group"
            type="radio"
            defaultChecked={allCheck}
            onChange={handleFilterByAllEventsChange}
          />
          <Form.Check
            inline
            label="Current"
            name="group"
            type="radio"
            defaultChecked={currentCheck}
            onChange={handleFilterByCurrentEventsChange}
          />
          <Form.Check
            inline
            label="Expired"
            name="group"
            type="radio"
            defaultChecked={expiredCheck}
            onChange={handleFilterByExpiredEventsChange}
          />
        </div>
      </Form>

      <form
        className="d-flex"
        onSubmit={handleOnSubmit}
        data-testid="SearchBoxForm"
      >
        <input
          value={searchText}
          data-testid="SearchBoxInput"
          className="form-control"
          type="search"
          placeholder="Search events by title"
          aria-label="Search"
          onChange={handleOnChange}
        />
      </form>

      <EventCardContainer>
        {loading || networkStatus === NetworkStatus.refetch ? (
          <Spinner />
        ) : data?.eventsData?.events?.length ? (
          data.eventsData.events.map((event) => {
            return (
              <EventCardWrapper key={event.id}>
                <Card
                  isPrivate={event.isPrivate}
                  title={event.title ?? ''}
                  subtitle={`${new Date(
                    event.start as string
                  ).toLocaleString()} - ${new Date(
                    event.end as string
                  ).toLocaleString()}`}
                  exSubTitle={getExSubTitle(event.end as string)}
                  content={event.description}
                  url={event.url ?? ''}
                  createdBy={event?.createdBy?.username ?? ''}
                  createdAt={event.createdAt as any}
                  updatedAt={event.updatedAt as any}
                  onClick={() => clickEventHandler(event as IEvent)}
                />
              </EventCardWrapper>
            );
          })
        ) : !error ? (
          <div className="event-card">
            <Alert
              msg="No results were found."
              type="warning"
              ariaLabel="Warning:"
              fillType="#exclamation-triangle-fill"
            />
          </div>
        ) : null}
      </EventCardContainer>

      {!loading && (
        <div className="float-end">
          <Pagination
            total={data?.eventsData?.totalCount || 0}
            itemsPerPage={EVENTS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {showModal && (
        <Modal
          title={title}
          closeOnSubmit={true}
          disableSubmitBtn={disableSaveBtn}
          hideSubmitBtn={hideSaveBtn}
          displayDeleteBtn={displayDeleteBtn}
          disableDeleteBtn={disableDeleteBtn}
          isSubmitLoading={saveEventLoading}
          isDeleteLoading={deleteEventLoading}
          closeBtnName={
            authCtx.auth?.userId === createdById ? 'Cancel' : 'Close'
          }
          onClose={() => setShowModal(false)}
          onDelete={handleDeleteEvent}
          onSubmit={handleSaveEvent}
          children={
            <EventBody
              title={eventTitle}
              start={start}
              end={end}
              isPrivate={isPrivate}
              description={description}
              disableEdit={false}
              createdById={createdById}
              onTitle={(title) => setEventTitle(title)}
              onDescription={(description) => setDescription(description)}
              onStart={(start) => setStart(start)}
              onEnd={(end) => setEnd(end)}
              onIsPrivate={(isPrivate) => setIsPrivate(isPrivate)}
              onValidate={(valid) => setDisableSaveBtn(!valid)}
            />
          }
        />
      )}
    </>
  );
};

export default SearchEvents;
