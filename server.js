var http=require('http');
var fs=require('fs');
var url=require('url');
var bodyParser=require('body-parser');
var express=require('express');
var app=express();
var expressValidator=require('express-validator');
var expressSession=require('express-session');
var mysql=require('mysql');
var mime = require('mime-types')

var vrsta=mime.lookup('Stil.css');



app.use(express.static('./'));//app.use(express.static('public'));koristi se za direktno serviranje filova('public') je ime foldera koji se može dohvatiti iz browsera
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(expressSession({secret:'max',saveUnitialized:false,resave:false}));
app.use(express.static(__dirname + '/public/'));



app.set('view engine', 'pug');
app.set('views','./views');


var server=app.listen(8000,function()
{
  var host=server.address().address;
  var port=server.address().port;

  console.log("adresa:"+host+" i port:"+port);
  console.log("File vrsta "+vrsta);
});

var konekcija=mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'',
  database:'projekt'
});

konekcija.connect(function(err){
  if(err){console.log('pogreska pri poezivanju s bazom'+err);}
  console.log('povezano s bazom');
});

app.get('/',function(req,res)
{
  res.render('prijava',{naslov:'Prijava',success:req.session.success,errors:req.session.errors,poruka:""});
  req.session.errors=null;
});

app.post('/submit',function(req,res)
{
  req.check('korisnickoime','Polje korisnicko ime ne smije biti prazno').notEmpty();
  req.check('lozinka','Polje lozinka ne smije biti prazno').notEmpty();

  var errors=req.validationErrors();
  if(errors)
  {
    req.session.errors=errors;
    req.session.success=false;
    console.log('imamo pogreske '+JSON.stringify(errors));
    res.redirect('/');
  }
  else{
    req.session.success=true;
    console.log('neamo pogreske');
    ProvjeriKorisnika(req,res);
  }
});

app.post('/provjera',function(req,res)
{
  ProvjeriKorisnika(req);
});

app.post('/ispis',function(req,res){
  res.send('Ime: '+req.body.ime+"lozinka:"+req.body.lozinka);
});

function ProvjeriKorisnika(req,odg)
{
  var upit="select * from korisnici where korisnickoime = '"+req.body.korisnickoime+"' and lozinka = '"+req.body.lozinka+"'";

  konekcija.query(upit,function(err,res)
  {
    if(err){console.log(err);}
    else
    {
      if(JSON.stringify(res)=='[]')
      {
        console.log('nema korisnika');
        console.log(res);
        console.log(req.body.korisnickoime+" "+req.body.lozinka);
        odg.render('prijava',{naslov:'Prijava',success:req.session.success,errors:req.session.errors,poruka:"Unesite točnu lozinku i korisničko ime"});
      }
      else
      {
        console.log('ima korisnika');
        console.log(res);
       /*odg.redirect(url.format({
         pathname:"/home",
         query: {
           "korisnickoime":req.body.korisnickoime ,
           //"lozinka": req.body.lozinka,
         }
       }));*/

       var upitdohvati="SELECT filmovi FROM korisnici WHERE korisnickoime='"+req.body.korisnickoime+"'";
       konekcija.query(upitdohvati,function(err2,odg2)
       {
         if(err2){console.log('pogreska kod dohvacanja podataka '+err2);}
         else
         {
           var nizjsonfilmova=[];
           if(odg2[0].filmovi!='')
           {
             nizjsonfilmova=JSON.parse(odg2[0].filmovi);
           }
       odg.render('home',{poruka:"Dobro došli "+req.body.korisnickoime,postojecifilm:"",nizfilmova:nizjsonfilmova});
     }
   });
 }
}
 });
}


app.get('/home',function(req,res)
{
  res.render('home',{poruka:"Dobro došli "+req.query.korisnickoime});

  console.log(req.query.korisnickoime);
  console.log(req.query.lozinka);
});

app.get('/registracija',function(req,res)
{
  res.render('registracija',{success:req.session.success,errors:req.session.errors});
  req.session.errors=null;
});

app.post('/provjeraRegistracije',function(req,res)
{
  req.check('korisnickoime','Polje korisnicko ime ne smije biti prazno').notEmpty();
  req.check('lozinka','Polje lozinka ne smije biti prazno').notEmpty();
  req.check('lozinkaponovljena','Ponovljena lozinka je pogrešna').equals(req.body.lozinka);
  req.check('lozinkaponovljena','Ponovljena lozinka ne smije biti prazna').notEmpty();
  req.check('mail','Unesite mail').isEmail();
  req.check('mail','Polje email ne smije biti prazno').notEmpty();

  var errors=req.validationErrors();
  if(errors)
  {
    req.session.errors=errors;
    req.session.success=false;
    console.log('imamo pogreske '+JSON.stringify(errors));
    res.redirect('/registracija');
  }
  else{
    req.session.success=true;
    console.log('neamo pogreske');
    ProvjeraRegistracije(req,res);
  }
});

function ProvjeraRegistracije(req,res)
{
  var upit="select korisnickoime from korisnici where korisnickoime='"+req.body.korisnickoime+"'";

  konekcija.query(upit,function(err,odg)
  {
    if(err){console.log(err);}
    else if (JSON.stringify(odg)=='[]')
    {
      console.log('korisnicko ime ne postoji');

      var upit2="insert into korisnici (korisnickoime,lozinka,mail) values ('"+req.body.korisnickoime+"','"+req.body.lozinka+"','"+req.body.mail+"')";
      konekcija.query(upit2,function(error,odg2)
      {
        if(error){console.log('neuspjesno dodavanje korisnika u bazu')}
        else{console.log('korisnik dodan u bazu');}
      });
      res.render('unos');
    }
    else{
      console.log('korisnicko ime postoji');
      res.render('registracija',{poruka:"molimo vas odaberite drugo korisničko ime.",success:req.session.success,errors:req.session.errors});
    }
  });
}

app.post('/unosubazu',function(req,res)
{
  var a=req.body.json;

  console.log(typeof(a));
  console.log(a);

  if(req.body.json==undefined || req.body.json=='')
  {
    console.log('prazan json');
  }
  else
  {
    var json=JSON.parse(req.body.json);

    var upitdohvati="SELECT filmovi FROM korisnici WHERE korisnickoime='"+req.body.ime+"'";
    konekcija.query(upitdohvati,function(err2,odg2)
    {
      if(err2){console.log('pogreska kod dohvacanja podataka '+err2);}
      else
      {
        var nizjsonfilmova=[];
        if(odg2[0].filmovi=='')
        {
          console.log('prazna baza');
          nizjsonfilmova.push(json);
          SpremiFilm(nizjsonfilmova,req.body.ime);
          res.render('home',{poruka:"Dobro došli "+req.body.ime,postojecifilm:"",nizfilmova:nizjsonfilmova});
        }
        else
        {
          console.log('baza nije prazna');

          var postoji=false;
          nizjsonfilmova=JSON.parse(odg2[0].filmovi);

          for (i = 0; i < nizjsonfilmova.length; i++)
          {
            if(nizjsonfilmova[i].Title==json.Title)
            {
              postoji=true;
              break;
              console.log('isti');
            }
          }

          if(!postoji)
          {
            nizjsonfilmova.push(json);
            var spremili=SpremiFilm(nizjsonfilmova,req.body.ime);
            console.log('ispred if');
            if(spremili)
            {
              console.log('dobili true');
              res.render('home',{poruka:"Dobro došli "+req.body.ime,postojecifilm:"",nizfilmova:nizjsonfilmova});
            }
            else
            {
              console.log('dobili false');
              res.render('home',{poruka:"Dobro došli "+req.body.ime,postojecifilm:"",nizfilmova:nizjsonfilmova});
            }
          }
          else {
            res.render('home',{poruka:"Dobro došli "+req.body.ime,postojecifilm:"Uneseni film već postoji u bazi ",nizfilmova:nizjsonfilmova});
          }
        }
      }
    });
  }
});

function SpremiFilm(nizfilmova,ime)
{
  var upitspremi="UPDATE korisnici SET filmovi='"+JSON.stringify(nizfilmova)+"' WHERE korisnickoime='"+ime+"'";

  konekcija.query(upitspremi,function(err,odg)
  {
    if(err){console.log('neuspjesna pohrana u bazu: '+err); return false;}
    else{console.log('uspjesna pohrana u bazu'); return true;}
  });
}


app.get('/api.js',function(req,res)
{
  res.sendFile('api.js',{root:__dirname});
});
