import { useState, useEffect, useRef } from "react";

import maplibregl from "maplibre-gl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Map, { GeolocateControl, Marker, NavigationControl, ScaleControl } from "react-map-gl";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Card, Modal, Pagination, Spinner, Table } from "react-bootstrap";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import DatePicker from "react-datepicker";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  useNavigate,
} from "react-router-dom";
import { atom, useAtom } from "jotai";

import canh_dong_ngo from "./assets/canh_dong_ngo.jpg";

import "react-datepicker/dist/react-datepicker.css";
import "./App.css";

const authAtom = atom(null);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
  },
  {
    path: "/expert",
    element: <ExpertPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  }
]);

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shouldShowModal, setShowModal] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);
  const navigate = useNavigate();

  function onPasswordChange(event) {
    setPassword(event.target.value)
  }

  function onUsernameChange(event) {
    setUsername(event.target.value)
  }

  async function onSubmit() {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      return setShowModal(true);
    }

    navigate('/expert');
  }

  function handleClose() {
    setShowModal(false);
  }

  return (
    <>
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundImage: `url(${canh_dong_ngo})`, backgroundSize: "cover" }}>
        <Card style={{ width: "400px" }}>
          <Card.Body >
            <Form>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>T??i kho???n</Form.Label>
                <Form.Control value={username} onChange={onUsernameChange} placeholder="T??n ????ng nh???p" />
                <Form.Text className="text-muted">
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>M???t kh???u</Form.Label>
                <Form.Control value={password} onChange={onPasswordChange} type="password" placeholder="M???t kh???u" />
              </Form.Group>
              <Button variant="primary" onClick={onSubmit}>
                ????ng nh???p
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
      <Modal show={shouldShowModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>L???i</Modal.Title>
        </Modal.Header>
        <Modal.Body>B???n ???? ??i???n sai t??n ????ng nh???p ho???c m???t kh???u</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            ????ng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

function fetchExpertLocations() {
  return fetch("/api/expert/locations").then(r => r.json());
}

function ExpertPage() {
  const { data: locations, isLoading: locationsLoading } = useQuery(['expert-location'], fetchExpertLocations);
  const [location, setLocation] = useState(null);
  const [page, setPage] = useState(0);

  return (
    <div className="d-flex vh-100">
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: 106.1143,
          latitude: 21.0474,
          zoom: 6,
        }}
        mapStyle="https://api.maptiler.com/maps/streets/style.json?key=o0Ab3tHQqm0ji14osmPM	"
      >
        <NavigationControl />
        <GeolocateControl />
        <ScaleControl />
        {
          !locationsLoading && locations.map(loc => (
            <Marker key={loc.location_id}
              latitude={loc.coordinates[0]}
              longitude={loc.coordinates[1]}
              onClick={() => setLocation(loc)}>
            </Marker>
          ))
        }
      </Map>
      <div className="sidebar p-3 shadow position-relative">
        <Card className="mb-3">
          <Card.Header>T???NG QUAN</Card.Header>
          <Card.Body className="px-5">
            {location ? <Overview location={location} /> : <em>H??y ch???n ?????a ??i???m tr??n b???n ?????</em>}
          </Card.Body>
        </Card>
        <Card className="mb-3">
          <Card.Header>TH??M TH??NG TIN</Card.Header>
          <Card.Body className="px-5">
            {location && <InsertForm page={page} locationId={location.location_id}/>}
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>L???CH S???</Card.Header>
          <Card.Body className="px-5 py-4">
            <ObservationTable locationId={location?.location_id} page={page} setPage={setPage}/>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

function InsertForm({ locationId, page }) {
  const [startDate, setStartDate] = useState();
  const [stage, setStage] = useState("default");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-observations', locationId, page]})
    }
  })

  function onSelect(event) {
    setStage(event.target.value);
  }

  async function submit() {
    return fetch("/api/expert/insert", {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ location_id: locationId, date: Math.floor(startDate / 1000), stage }),
    });
  }

  function onSubmit() {
    console.log("insert", locationId)
    mutation.mutate();
  }

  const button = mutation.isLoading ? <Spinner /> : <Button variant="primary" onClick={onSubmit}>
    Th??m th??ng tin
  </Button>;

  return (
    <Form>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label>Th???i gian</Form.Label>
        <Form.Control as={DatePicker} selected={startDate} onChange={(date) => setStartDate(date)} autoComplete="off" />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formBasicPassword">
        <Form.Label>Tu???i s??u</Form.Label>
        <Form.Select aria-label="Default select example" onChange={onSelect} value={stage}>
          <option value="default">Ch???n tu???i s??u</option>
          <option value="egg">Tr???ng</option>
          <option value="instar_1">S??u non 1</option>
          <option value="instar_2">S??u non 2</option>
          <option value="instar_3">S??u non 3</option>
          <option value="instar_4">S??u non 4</option>
          <option value="instar_5">S??u non 5</option>
          <option value="instar_6">S??u non 6</option>
          <option value="pupa">Nh???ng</option>
          <option value="imago">B?????m</option>
        </Form.Select>
      </Form.Group>
      {button}
      {mutation.error && <Form.Text id="passwordHelpBlock" muted>
        ???? c?? l???i
      </Form.Text>}
    </Form>
  );
};

function App() {
  return <RouterProvider router={router} />
}

function fetchLocations() {
  return fetch("/api/locations").then(r => r.json());
}

function Root() {
  const { isLoading, data } = useQuery(['locations'], fetchLocations);
  const [location, setLocation] = useState(null);

  return (
    <div className="d-flex vh-100">
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: 106.1143,
          latitude: 21.0474,
          zoom: 6,
        }}
        mapStyle="https://api.maptiler.com/maps/streets/style.json?key=o0Ab3tHQqm0ji14osmPM	"
      >
        <NavigationControl />
        <GeolocateControl />
        <ScaleControl />
        {
          !isLoading && data.map(loc => (
            <Marker key={loc.location_id}
              latitude={loc.coordinates[0]}
              longitude={loc.coordinates[1]}
              onClick={() => setLocation(loc)}>
            </Marker>
          ))
        }
      </Map>
      <div className="sidebar p-3 shadow position-relative">
        <Card className="mb-3">
          <Card.Header>T???NG QUAN</Card.Header>
          <Card.Body className="px-5">
            {location ? <Overview location={location} /> : <em>H??y ch???n ?????a ??i???m tr??n b???n ?????</em>}
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>CHI TI???T</Card.Header>
          <Card.Body className="px-5 py-4">
            <ChartContainer locationId={location?.location_id} />
            <h5>B???ng qu?? tr??nh ph??t tri???n</h5>
            <hr />
            <PredictionTable locationId={location?.location_id} />
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

function fetchObservations(location_id, page) {
  const params = new URLSearchParams({ location_id, page });
  return fetch("/api/expert/observations?" + params).then(r => r.json());
}

function ObservationTable({ locationId, page, setPage }) {
  const { error } = useQuery(['expert-observations', locationId, page], () => fetchObservations(locationId, page));

  return (
    <div>
      <Table striped hover>
        <thead>
          <tr>
            <th>Ng??y</th>
            <th>Nhi???t ????? (??C)</th>
            <th>Tu???i</th>
          </tr>
        </thead>
        <tbody>
          {locationId ? <ObservationTableBody locationId={locationId} page={page} />
            : <tr><td colSpan={4}><em>H??y ch???n ?????a ??i???m c???n d??? b??o.</em></td></tr>}
        </tbody>
      </Table>
      <Pagination className="float-end">
        <Pagination.Prev disabled={page === 0} onClick={() => setPage(p => p - 1)} />
        <Pagination.Next disabled={error} onClick={() => setPage(p => p + 1)} />
      </Pagination>
    </div>
  );
}

function ObservationTableBody({ locationId, page }) {
  const { isLoading, error, data } = useQuery(['expert-observations', locationId, page], () => fetchObservations(locationId, page));


  if (error) return <tr>
    <td colSpan={3}>D??? li???u ngo??i kho???ng cho ph??p</td>
  </tr>;

  if (isLoading) return <tr>
    <td colSpan={3}>??ang t???i d??? li???u...</td>
  </tr>;

  return data.map(row => (
    <tr key={[row.location_id, row.date]}>
      <td>{new Date(row.date).toLocaleDateString('en-GB')}</td>
      <td>{row.temperature?.toFixed(2)}</td>
      <td>{ageLookup[row.stage]}</td>
    </tr>
  )).reverse();
}

function fetchLocationInfo([lat, lon]) {
  const params = new URLSearchParams({ api_key: "VOYA1NhpdQ8S7MsjggNamyAPR3NdwRK51sPcjwDV", latlng: "" + lat + "," + lon })
  return fetch("https://rsapi.goong.io/Geocode?" + params).then(r => r.json());
}

function Overview({ location }) {
  const { isLoading: locationLoading, data: locationInfo } = useQuery([location], () => fetchLocationInfo(location.coordinates));
  const yesterday = Math.floor(new Date().setHours(-1) / 1000);
  const tomorrow = Math.floor(new Date().setHours(25) / 1000);
  const { isLoading: predictionLoading, data: prediction } = useQuery(['overview_prediction', location.location_id, yesterday, tomorrow], () => fetchHistory(location.location_id, yesterday, tomorrow));
  const compound = locationLoading ? undefined : locationInfo.results[0].compound;

  if (locationLoading || predictionLoading) return "??ang t???i d??? li???u...";

  return (
    <div className="d-flex">
      <div className="flex-grow-1">
        <h5>{compound.district}</h5>
        <div>{compound.province}</div>
      </div>
      <h4 className="flex-grow-1">{ageLookup[prediction.at(-1).stage]}</h4>
    </div>
  );
}

function fetchHistory(location_id, start, end) {
  const params = new URLSearchParams({ location_id, start, end });
  return fetch("/api/history?" + params).then(r => r.json());
}

const ageLookup = {
  "egg": "Tr???ng",
  "instar_1": "S??u non 1",
  "instar_2": "S??u non 2",
  "instar_3": "S??u non 3",
  "instar_4": "S??u non 4",
  "instar_5": "S??u non 5",
  "instar_6": "S??u non 6",
  "pupa": "Nh???ng",
  "imago": "B?????m",
};

function TableBody({ locationId, start, end }) {
  const { isLoading, error, data } = useQuery(['history', locationId, start, end], () => fetchHistory(locationId, start, end));

  if (error) return <tr>
    <td colSpan={4}>D??? li???u ngo??i kho???ng cho ph??p</td>
  </tr>;

  if (isLoading) return <tr>
    <td colSpan={4}>??ang t???i d??? li???u...</td>
  </tr>;

  return data.map(row => (
    <tr key={[row.location_id, row.date]}>
      <td>{new Date(row.date).toLocaleDateString('en-GB')}</td>
      <td>{row.temperature?.toFixed(2)}</td>
      <td>{ageLookup[row.stage]}</td>
      <td>{row.dday?.toFixed(2)}</td>
    </tr>
  )).reverse();
}

function PredictionTable({ locationId }) {
  const [page, setPage] = useState(0);

  const twoWeek = 14 * 86400;
  const end = Math.floor(Date.now() / 1000) - page * twoWeek;
  const start = end - twoWeek;
  const { error } = useQuery(['history', locationId, start, end], () => fetchHistory(locationId, start, end));

  return (
    <div>
      <Table striped hover>
        <thead>
          <tr>
            <th>Ng??y</th>
            <th>Nhi???t ????? (??C)</th>
            <th>Tu???i</th>
            <th>T.t??ch ??n</th>
          </tr>
        </thead>
        <tbody>
          {locationId ? <TableBody locationId={locationId} start={start} end={end} />
            : <tr><td colSpan={4}><em>H??y ch???n ?????a ??i???m c???n d??? b??o.</em></td></tr>}
        </tbody>
      </Table>
      <Pagination className="float-end">
        <Pagination.Prev disabled={page === 0} onClick={() => setPage(p => p - 1)} />
        <Pagination.Next disabled={error} onClick={() => setPage(p => p + 1)} />
      </Pagination>
    </div>
  );
}

function ChartContainer({ locationId }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const onChange = (dates) => {
    const [start, end] = dates;
    console.log(locationId);
    setStartDate(start);
    setEndDate(end);
  };

  const start = Math.floor(startDate / 1000);
  const end = Math.floor(endDate / 1000);
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  today = Math.floor(today / 1000);

  return (
    <div>
      <div className="d-flex flex-justify-center">
        <div className="mb-3 mx-auto">
          <div className="d-inline-flex align-items-center">
            <span className="flex-shrink-0 px-2">Kho???ng th???i gian</span>
            <DatePicker
              selected={startDate}
              onChange={onChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
            />
          </div>
        </div>
      </div>
      {startDate && endDate && locationId &&
        (end <= today ? <Chart start={start} end={end} locationId={locationId} /> : <MixedChart start={start} end={end} locationId={locationId} />)}
    </div>
  );

}

function fetchForecast(location_id) {
  const params = new URLSearchParams({ location_id });
  return fetch("/api/forecast?" + params).then(r => r.json());
}

function MixedChart({ locationId, start, end }) {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  today = Math.floor(today / 1000);

  const clampedEnd = Math.min(end, today);
  const clampedStart = Math.max(start, today);
  const { isLoading: historyLoading, data: history } = useQuery(['history', locationId, start, end], () => fetchHistory(locationId, start, end));
  const { isLoading: forecastLoading, data: forecast } = useQuery(['forecast', locationId], () => fetchForecast(locationId));

  if (historyLoading || forecastLoading) return null;

  let data = history.concat(forecast);

  const endIdx = data.findIndex(e => new Date(e.date) > new Date(end * 1000));
  console.log(data)
  console.log("idx:", endIdx);
  console.log("end:", end)
  data = data.slice(0, endIdx);

  const chartData = data.map(row => {
    const stage = Object.keys(ageLookup).indexOf(row.stage);
    const date = "" + new Date(row.date).getDate() + "/" + (new Date(row.date).getMonth() + 1);
    return { ...row, date, stage: stage >= 0 ? stage : null };
  });

  return chartData &&
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}
        margin={{ left: -35, right: -40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="temperature" />
        <YAxis yAxisId="stage" orientation="right" />
        <Tooltip />
        <Legend />
        <Line name="Nhi???t ?????" yAxisId="temperature" dataKey="temperature" stroke="#8884d8" />
        <Line name="Tu???i" yAxisId="stage" dataKey="stage" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
}

function Chart({ locationId, start, end }) {
  const { isLoading, data } = useQuery(['history', locationId, start, end], () => fetchHistory(locationId, start, end));
  const chartData = isLoading ? null : data.map(row => {
    const stage = Object.keys(ageLookup).indexOf(row.stage);
    const date = "" + new Date(row.date).getDate() + "/" + (new Date(row.date).getMonth() + 1);
    return { ...row, date, stage: stage >= 0 ? stage : null };
  });

  return chartData &&
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}
        margin={{ left: -35, right: -40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="temperature" />
        <YAxis yAxisId="stage" orientation="right" />
        <Tooltip />
        <Legend />
        <Line name="Nhi???t ?????" yAxisId="temperature" dataKey="temperature" stroke="#8884d8" />
        <Line name="Tu???i" yAxisId="stage" dataKey="stage" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
}

export default App;
