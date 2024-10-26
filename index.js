import pg from "pg";
import express from "express";
import bodyParser from "body-parser";


const port = 3000;
const app = express();
const bookCoverURL = "https://covers.openlibrary.org/b/isbn/"


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "book_notes",
    password: "Asakapa00",
    port: 5432,
});

db.connect();



app.get("/", async (req, res) => {

    try {
    const response = await db.query("SELECT * FROM books ORDER BY id ASC");
    const bookData = response.rows
    let bookCover = [];
    let formattedDates = [];
    bookData.forEach((book) => {
        const imgCover = `${bookCoverURL}${book.isbn}-L.jpg`
        bookCover.push(imgCover);
        const date = book.date_finished;
        const options = { year: 'numeric', month: 'short', day: 'numeric'};
        const formattedDate = date.toLocaleDateString('en-US', options);
        formattedDates.push(formattedDate);
    })

    res.render("index.ejs", {books:bookData, cover:bookCover, date: formattedDates})
    } catch (err) {
        console.log(err);
    }
})


app.get("/add-book", (req, res) => {
    try {
        res.render("add.ejs");
    } catch (err) {
        console.log(err);
    }
})

app.post("/add", async (req, res) => {
    const bookTitle = req.body.title;
    const bookAuthor = req.body.author;
    const rating = req.body.rating;
    const isbn = req.body.isbn;
    const date = req.body.date;
    const review = req.body.review;

    try {
        await db.query("INSERT INTO books (book_name, book_author, review, rating, date_finished, isbn) VALUES ($1, $2, $3, $4, $5, $6)",[bookTitle, bookAuthor, review, rating, date, isbn])
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
})

app.post("/edit-book", async (req, res) => {
    const bookId = req.body.editBook;
    try {
        const response = await db.query("SELECT id, book_name, book_author, rating, review FROM books WHERE id=$1",[bookId]);
        const bookToEdit = response.rows[0];
        res.render("edit.ejs", {book: bookToEdit});
    } catch (err) {
        console.log(err)
    }
})

app.post("/edit", async (req, res) => {
    const editTitle = req.body.title;
    const editAuthor = req.body.author;
    const editRating = req.body.rating;
    const editReview = req.body.review;
    const editID = req.body.bookid;
    console.log(editID)
    try {
        await db.query("UPDATE books SET book_name=$1, book_author=$2, rating=$3, review=$4 WHERE id=$5", [editTitle, editAuthor, editRating, editReview, editID])
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
})

app.post("/delete", async (req, res) => {
    const deleteBookID = req.body.deleteBook;
    try {
        await db.query("DELETE FROM books WHERE id=$1", [deleteBookID]);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
})

app.post("/filter", async (req, res) => {
    const filterValue = req.body.filter;
    const orderValue = req.body.order;
    let response = [];
    try {
        if (filterValue === "rating" && orderValue ==="ascending") {
            response = await db.query("SELECT * FROM books ORDER by rating ASC");
        } else if (filterValue === "rating" && orderValue ==="descending") {
            response = await db.query("SELECT * FROM books ORDER by rating DESC");
        } else if (filterValue === "date" && orderValue ==="ascending") {
            response = await db.query("SELECT * FROM books ORDER by date_finished ASC");
        } else if (filterValue === "date" && orderValue ==="descending") {
            response = await db.query("SELECT * FROM books ORDER by date_finished DESC");
        }

        const bookResult = response.rows;
        let bookCover = [];
        let formattedDates = [];
        bookResult.forEach((book) => {
            const imgCover = `${bookCoverURL}${book.isbn}-L.jpg`
            bookCover.push(imgCover);
            const date = book.date_finished;
            const options = { year: 'numeric', month: 'short', day: 'numeric'};
            const formattedDate = date.toLocaleDateString('en-US', options);
            formattedDates.push(formattedDate);
        })
        res.render("filter.ejs", {books: bookResult, cover:bookCover, date: formattedDates, filter: filterValue, order: orderValue})

    } catch (err) {
        console.log(err);
    }
})

app.listen(port, () =>{
    console.log(`Server running on ${port}`);
})
