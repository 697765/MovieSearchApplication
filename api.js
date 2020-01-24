window.onload=function()
{
  $("#opisfilma").height($("#opisslika").height());
  $("#movie").hide();
}

    var zahtjev;

    function ProvjeriUnos()
    {
      var imefilma=$("#imeFilma").val();
      console.log(imefilma);
      if(imefilma=='')
      {
        $("#error").text('unesite ime filma')
        return true;
      }
      else
      {
        $("#imeFilma").css("background-color", "transparent");
        return false;
      }
    }


    function PosaljiAPI()
    {
      $("#error").text('');
      $("#postojecifilm").text('');
      var prazan=ProvjeriUnos();
      if(prazan)
      {
        console.log('unesite film');
      }
      else
      {
        var imefilma=$("#imeFilma").val();
        zahtjev=new XMLHttpRequest();
        zahtjev.onreadystatechange=DohvatiZahtjev;
        zahtjev.open('GET','http://www.omdbapi.com/?apikey=51e5c1ee&t='+imefilma.replace(/ /g,"+"),true);
        zahtjev.send();
      }
    }

    function DohvatiZahtjev()
    {
      var rez;

      if(zahtjev.status=="200" && zahtjev.readyState==4)
      {
        rez=JSON.parse(zahtjev.responseText);

        if(!("Error" in rez )==0)
        {
          console.log("Error" in rez)
          $("#error").text('uneseni film ne postoji');
        }
        else {
          console.log(rez);

          var beznavodnika=zahtjev.responseText.replace(/'/g,"").replace(/\\\"/g," ");
          $("#movie").show();

          if(rez.Poster=='N/A'){$("#slika").attr("src","/public/smile.jpg");}
          else {$("#slika").attr("src",rez.Poster);}

          $("#naslov").text(rez.Title+"("+rez.Year+")");
          $("#genre").text(rez.Genre);
          $("#plot").text(rez.Plot);
          $("#imdbrating").text("");

          rating = parseInt(rez.imdbRating);

          for(i=0;i<10;i++)
          {
            if(i < rating)
            {
              $("#imdbrating").append("<span class=star>★</span>");
            }
            else {
              $("#imdbrating").append("<span class=nonrate>★</span>");
            }
          }

          $('#json').val(beznavodnika);
          console.log(zahtjev.responseText);
          console.log(beznavodnika);
        }
      }
    }
