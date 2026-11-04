<?php $price = get_post_meta( get_the_ID(), 'mansa_price_from', true ); ?>
<article class="card">
	<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
	<p><?php echo esc_html( get_the_excerpt() ); ?></p>
	<?php if ( $price ) : ?><p class="price">a partir de <strong><?php echo esc_html( $price ); ?></strong></p><?php endif; ?>
</article>
