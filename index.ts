import express from "express";
import pg  from "pg";
import bodyparser from "body-parser";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import jwt from "jsonwebtoken";




const app = express(); 
const port = 8080;
const dirname = "/home/jeba-prakash/Jeba/task";
const secret_key = "secret_key"

app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine", "ejs");

const db = new pg.Client({
    user : "student",
    host: "localhost",
    database: "studentdb",
    password : "7868",
    port : 5432
});

db.connect(); 

app.get("/", (req,res,err)=>{
    res.render(path.join(dirname,"/frontend/index.ejs"),{name :"",email : " ",password : "", confirm: ""})
});

app.get("/student",async(req,res)=>{
    const get_data = await db.query("SELECT * FROM student ORDER BY id ASC;");
    const studentdata = get_data.rows;
    // console.log(studentdata);
    res.render(path.join(dirname,"/frontend/student.ejs"),{studentdata:studentdata , error:" ",fname:" ",lname:" ", email:" ", register_no: " ",phone_no:" ",dob:" ",address:" ",gender:" ",id:"",token:"token"});
});
                                      
app.post("/submit",async(req,res)=>{
    let name :string = req.body.name;
    let email :string = req.body.email;
    let password :string= req.body.password;
    let confirm :string = req.body.confirm;
    const user_check = " SELECT email FROM register WHERE email = $1";
    const check_user = await db.query(user_check,[email])
    const check_email = check_user.rows;

    if(check_email.length >0){
        return res.render(path.join(dirname,"/frontend/index.ejs"),{check_email :check_email,name :name,email : email,password : password, confirm: confirm})
    }

    const insert_query = "INSERT INTO register (name,email,password) VALUES($1,$2,$3);"
    const VALUES = [name,email,password];
    await db.query(insert_query,VALUES);
    return  res.redirect('/login') 
     
})

app.get('/login',(req,res)=>{
    res.render(path.join(dirname,"/frontend/login.ejs"),{error: " "});
});

app.post('/login/user',async(req,res)=>{
    let email: string = req.body.email;
    let password: string = req.body.password;
    const get_data = await db.query("SELECT * FROM student ORDER BY id ASC;");
    const studentdata = get_data.rows;

    const get_login = "SELECT password FROM public.register WHERE email = $1;";
    const result = await db.query(get_login, [email]);
    // res.render(path.join(dirname, "/frontend/login.ejs"), {error: " "});
    
    // console.log(password)
    if (result.rows.length === 0) {
        res.render(path.join(dirname, "/frontend/login.ejs"), {error: "Invalid email or password"});
    }
    const confirmPassword = result.rows[0].password
    //  console.log(confirmPassword);
    if(password != confirmPassword){
        res.render(path.join(dirname,"/frontend/login.ejs"),{error: "Invalid  password"});
    }
    else{
        const token = jwt.sign({email},secret_key);
        console.log(token)
        // const token = "access_key"
        res.render(path.join(dirname,"/frontend/student.ejs"),{studentdata:studentdata , error:" ",fname:" ",lname:" ", email:" ", register_no: " ",phone_no:" ",dob:" ",address:" ",gender:" ",id:"",token: token});

    }

    
});
   

app.get('/attendence',async(req,res)=>{
    const get_data = await db.query("SELECT * FROM student ORDER BY id ASC;");
    const studentdata = get_data.rows;
    res.render(path.join(dirname,"/frontend/attendence.ejs"),{studentdata:studentdata , error:" ",fname:" ",lname:" ", email:" ", register_no:"",phone_no:" ",dob:" ",address:" ",gender:" ",id:""});
});

app.get('/register',(req,res)=>{
    res.redirect('/');
})

app.get('/logout',(req,res)=>{
    res.redirect('/');
})

app.post('/student/data',async(req,res)=>{
    let fname: string  = req.body.fname;
    let lname: string  = req.body.lname;
    let name: string  = fname + " " +lname;
    let email: string  = req.body.email;
    function parseInteger(value: any): number | null {
     const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed; 
    }
    let register_no = parseInteger(req.body.register_no);
    let phone_no = parseInteger(req.body.phone_no);

    let dob : string  = req.body.dob;
    let gender : string = req.body.gender;
    let address : string  = req.body.address;
   
    const check_student = await db.query("SELECT register_no FROM student WHERE register_no = $1",[register_no]);
   
    if(check_student.rows.length >0){
        const get_data = await db.query("SELECT * FROM student ORDER BY id ASC;");
        return res.render(path.join(dirname,"/frontend/student.ejs"),{studentdata :get_data.rows,error: "register_no alredy exist",fname:fname,lname:lname, email:email, register_no: register_no,phone_no:phone_no,dob:dob,address:address,gender:gender,id:""})
    }

    const studentdata = {name,email,phone_no,dob,gender,address,register_no }
    const insert_data ="INSERT INTO student (name,email,phone_no,dob,gender,address,register_no) VALUES($1,$2,$3,$4,$5,$6,$7);"
    const VALUES = [name,email,phone_no,dob,gender,address,register_no];
    await db.query(insert_data,VALUES);

    return res.redirect('/student')  
   
});

app.post('/delete', async(req,res)=>{
    const register_no = req.body.register_no;
    const delete_query = await db.query("DELETE  FROM student WHERE register_no = $1 ",[register_no]);
    res.redirect('/student');
});

app.get('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const edit_data = await db.query("SELECT * FROM student WHERE id = $1", [id]);
  const student = edit_data.rows[0];
  const all_students = await db.query("SELECT * FROM student ORDER BY id ASC");
  const [first, ...rest] = student.name ? student.name.trim().split(/\s+/) : ["", ""];
  const fname = first || "";
  const lname = rest.join(" ") || "";
  

  res.render(path.join(dirname, "/frontend/student.ejs"), {
    studentdata: all_students.rows,
    error: "",
    id: id,
    fname,
    lname,
    email: student.email,
    register_no: student.register_no,
    phone_no: student.phone_no,
    dob: student.dob,
    address: student.address,
    gender: student.gender,
    token:"token"
  });
});



app.post('/edit/:id', async (req, res) => {
  const id = req.params.id;

  function parseInteger(value: any): number | null {
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}
  const fname : string = req.body.fname;
  const lname : string = req.body.lname;
  const name : string = fname + " " + lname;
  const email: string  = req.body.email;
  let register_no = parseInteger(req.body.register_no);
  let phone_no = parseInteger(req.body.phone_no);
  const dob: string  = req.body.dob;
  const gender : string = req.body.gender;
  const address : string = req.body.address;

  const update_query = `
    UPDATE student 
    SET name = $1, email = $2, phone_no = $3, dob = $4, gender = $5, address = $6, register_no = $7 
    WHERE id = $8
  `;

  const VALUES = [name, email, phone_no, dob, gender, address, register_no, id]; 
  await db.query(update_query, VALUES);
  res.redirect('/student');
});



app.get('/cancel',(req,res)=>{
    res.redirect('/student');
})
app.get('/cancel/form',(req,res)=>{
    res.redirect('/student');
})



app.get('/marks',async(req,res)=>{
    const get_data = await db.query("SELECT * FROM student ORDER BY id ASC;");
    const studentdata = get_data.rows;
    const get_marks = await db.query("SELECT * FROM student_marks ORDER BY id ASC");
    const student_marks = get_marks.rows;
    // console.log(student_marks);
    res.render(path.join(dirname,"/frontend/marks.ejs"),
        {studentdata:studentdata,
         student_marks : student_marks,
         tamil:"",
         english:"",
         maths:"",
         science:"",
         social_science: "",
         register_no:"",
         total:"",
         name:'Student name'
        });
});

app.post('/add/marks', async(req,res)=> {
    try{
        function parseInteger(value: any): number | null {
           const parsed = parseInt(value);
           return isNaN(parsed) ? null : parsed;
      }

    const register_no = req.body.tamil ? Number(req.body.register_no) : 0;
    let get_name = await db.query("SELECT name FROM student WHERE register_no  = $1", [register_no]);
    let name = get_name.rows[0].name;
    const tamil = req.body.tamil ? Number(req.body.tamil) : 0;
    const english = req.body.english ? Number(req.body.english) : 0;
    const maths = req.body.maths ? Number(req.body.maths) : 0;
    const science = req.body.science ? Number(req.body.science) : 0;
    const social_science = req.body.social_science ? Number(req.body.social_science) : 0;

    let total:number = Number(tamil) + Number(english)+ Number(maths)+ Number(science)+ Number(social_science);
    
  function getGrade(total :number){ 
    if (tamil < 35 || english < 35 || maths < 35 || science < 35 || social_science < 35) {
              return 'FAIL';
    }

    if(total > 450){
        return 'A+';
    } else if(total >= 400){
        return 'A';
    } else if(total >= 350){
        return 'B+';
    } else if(total >= 300){
        return 'B';
    } else if(total >= 250){
        return 'C';
    } else {
        return 'FAIL';
    }
   }
   let grade = getGrade(total)
 
    // console.log(name,register_no,tamil,english,maths,science,social_science,total,grade);

    const mark_query = "INSERT INTO student_marks ( name,register_no,tamil,english,maths,science,social_science,total,grade) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)";
    const VALUES = [name,register_no,tamil,english,maths,science,social_science,total,grade];
    await  db.query(mark_query,VALUES);
    res.redirect('/marks')
}catch{
    res.send("select the name ")
}
});

app.post('/marks/delete',async(req,res)=>{
    const register_no :number = req.body.register_no;
    console.log(register_no);
    const delete_query = await db.query("DELETE FROM student_marks WHERE register_no = $1 ",[register_no]);
    res.redirect('/marks');
});

app.get('/marks/edit/:id',async(req,res)=>{
    const id = req.params.id;
    const marks = await db.query("SELECT * FROM student_marks WHERE id = $1",[id]);
    const student_mark = marks.rows[0];
    const register_no = student_mark.register_no
    // console.log(student_mark.tamil)
    const student = await db.query("SELECT * FROM student ORDER BY id ASC;");
    const studentdata = student.rows;
    const get_marks = await db.query("SELECT * FROM student_marks ORDER BY id ASC");
    const student_marks = get_marks.rows;
    
    res.render(path.join(dirname,"/frontend/marks.ejs"),{studentdata: studentdata, 
        student_marks : student_marks,
        tamil:student_mark.tamil,
        english:student_mark.english,
        maths:student_mark.maths,
        science:student_mark.science,
        social_science:student_mark.social_science,
        register_no:register_no,
        total:student_mark.total,
        name:student_mark.name
        })
});

app.post('/marks/update', async (req, res) => {
  try {
    const register_no = Number(req.body.register_no);
    const tamil = Number(req.body.tamil);
    const english = Number(req.body.english);
    const maths = Number(req.body.maths);
    const science = Number(req.body.science);
    const social_science = Number(req.body.social_science);

    if (!register_no) {
      return res.status(400).send("Student not selected");
    }

  
    const subjects = { tamil, english, maths, science, social_science };
    for (let [subject, mark] of Object.entries(subjects)) {
      if (isNaN(mark) || mark < 0 || mark > 100) {
        return res
          .status(400)
          .send(`Invalid ${subject} mark: ${mark}. It must be between 0 and 100.`);
      }
    }

    const total:number =  tamil + english + maths + science + social_science;

    function getGrade(total: number) {
      if (
        tamil < 35 ||
        english < 35 ||
        maths < 35 ||
        science < 35 ||
        social_science < 35
      ) {
        return "FAIL";
      }

      if (total > 450) return "A+";
      if (total >= 400) return "A";
      if (total >= 350) return "B+";
      if (total >= 300) return "B";
      if (total >= 175) return "C";
      return "FAIL";
    }

    const grade = getGrade(total);

    const update_query = `
      UPDATE student_marks 
      SET tamil = $1, english = $2, maths = $3, science = $4, social_science = $5, total = $6, grade = $7
      WHERE register_no = $8
    `;

    const values = [tamil, english, maths, science, social_science, total, grade, register_no];

    await db.query(update_query, values);

    res.redirect("/marks");
  } catch (err) {
    console.error("Error updating marks:", err);
    res.status(500).send("Error updating marks");
  }
});


app.listen(port, ()=>{
    console.log("the server is running on port 8080");
});
