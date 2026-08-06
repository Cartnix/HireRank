from app import crud
from app.models import Item, ItemCreate
from tests.utils.user import SupportsSessionRun, create_random_user
from tests.utils.utils import random_lower_string


def create_random_item(db: SupportsSessionRun) -> Item:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    title = random_lower_string()
    description = random_lower_string()
    item_in = ItemCreate(title=title, description=description)
    return db.run(
        crud.create_item(session=db.session, item_in=item_in, owner_id=owner_id)
    )
