import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

function CardSlider() {
     const cards = [
          { title: "Card 1", text: "This is card 1" },
          { title: "Card 2", text: "This is card 2" },
          { title: "Card 3", text: "This is card 3" },
          { title: "Card 4", text: "This is card 4" },
          { title: "Card 5", text: "This is card 5" },
     ];

     const cardColors = [
          "#FF6F61", // coral pop
          "#4CD7D0", // aqua pop
          "#FFB400", // warm yellow
          "#00B8A9", // teal
          "#FF3CAC", // neon pink
          "#E3FDFD", // mint highlight
          "#7847FF"  // electric purple
     ];


     return (
          <div
               style={{
                    width: "75%",
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                    // padding: "2px",
                    marginLeft: "11rem",
                    marginTop: "3rem",
                    height: "85vh",
               }}
          >
               <h1 className="text-xl md:text-3xl font-bold ml-1 mb-12 mt-7 ">My Current Projects</h1>
               {cards.map((item, index) => {
                    const bg = cardColors[index % cardColors.length];
                    const textColor = ["#E3FDFD", "#ECECEC"].includes(bg)
                         ? "#000"
                         : "#FFF";

                    return (
                         <Card
                              key={index}
                              style={{
                                   width: "18rem",
                                   height: "14rem",
                                   display: "inline-block",
                                   marginRight: "16px",
                                   backgroundColor: bg,
                                   color: textColor,
                                   borderRadius: "12px",
                                   padding: "4px"
                              }}
                         >
                              <Card.Body>
                                   <Card.Title>{item.title}</Card.Title>
                                   <Card.Text>{item.text}</Card.Text>
                                   <Button variant="light">View</Button>
                              </Card.Body>
                         </Card>
                    );
               })}
          </div>
     );
}

export default CardSlider;
