import Navbar from '../components/shared/Navbar.jsx';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default PublicLayout;
