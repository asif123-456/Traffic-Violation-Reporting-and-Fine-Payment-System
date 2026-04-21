import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ReportViolation from './pages/ReportViolation';
import CheckFines from './pages/CheckFines';
import Payment from './pages/Payment';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportViolation />} />
          <Route path="/fines" element={<CheckFines />} />
          <Route path="/payment/:id" element={<Payment />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
