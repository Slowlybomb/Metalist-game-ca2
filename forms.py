from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, SelectField, IntegerField, TextAreaField, FileField
from wtforms.validators import InputRequired, EqualTo, DataRequired, NumberRange



class RegistrationFrom(FlaskForm):
    player_id = StringField("Player name:", validators=[InputRequired()])
    amount_of_enemies = SelectField("Amount of enemies:",default=5, choices=[
        (0, "0"),
        (1, "1"),
        (2, "2"),
        (3, "3"),
        (4, "5"),
        (5, "5")
    ])
    submit = SubmitField("PLAY")



