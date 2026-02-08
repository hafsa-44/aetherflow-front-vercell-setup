import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import logo from "./assets/logo.svg";

function UserCard() {
     return (
          <Card
               style={{ width: '18rem', backgroundColor: "rgba(36, 81, 136, 0.75)", color: "#E9E4De", borderRadius: "0", height: "30vh" }}
               className=" flex justify-center items-center rounded-one shadow-2xl"
          >
               <Card.Img variant="top" src={logo} style={{ height: "90px", width: "90px" }}
                    className=''
                    roundedCircle />

               <Card.Body>
                    <Card.Title className="text-white">UserName</Card.Title>
                    <Card.Text className="text-white">
                         A little description goes here
                    </Card.Text>
               </Card.Body>
          </Card>
     );
}

export default UserCard;
