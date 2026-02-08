import {
     Button,
     Container,
     Form,
     Nav,
     Navbar,
     Offcanvas,
     NavDropdown
} from "react-bootstrap";
import logo from "./assets/logo.svg";

function NavBar() {
     return (
          <>
               {["sm"].map((expand) => (
                    <Navbar key={expand} expand={expand} className=" mb-3 w-screen overflow-hidden shadow-2xl "
                         fixed="top"
                         style={{ backgroundColor: "#001F46", color: "#E9E4De" }}
                    >
                         <Container fluid className="m-1">
                              <div className="">
                                   <Navbar.Brand href="#" style={{ color: "#E9E4DE", marginRight: "5%" }}>
                                        <img
                                             src={logo}
                                             alt="Logo"
                                             width="40"
                                             height="40"
                                             className="d-inline-block mr-3"
                                        />
                                        Aether Flow</Navbar.Brand>
                                   <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
                              </div>
                              <Navbar.Offcanvas
                                   id={`offcanvasNavbar-expand-${expand}`}
                                   aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                                   placement="end"
                              >
                                   <Offcanvas.Header closeButton>
                                        <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>
                                             Offcanvas
                                        </Offcanvas.Title>
                                   </Offcanvas.Header>

                                   <Offcanvas.Body>
                                        <Nav className="justify-content-end flex-grow-1 pe-3" >
                                             <Nav.Link href="#action1" style={{ color: "#E9E4DE" }}>Home</Nav.Link>
                                             <Nav.Link href="#action2" style={{ color: "#E9E4DE" }}>Planing</Nav.Link>


                                        </Nav>

                                        <Form className="d-flex" >
                                             <Form.Control
                                                  type="search"
                                                  placeholder="Search"
                                                  className="me-2"
                                                  aria-label="Search"
                                             />
                                             <Button variant="outline-success">Search</Button>
                                        </Form>
                                   </Offcanvas.Body>
                              </Navbar.Offcanvas>
                         </Container>
                    </Navbar>
               ))}
          </>
     );
}

export default NavBar;
